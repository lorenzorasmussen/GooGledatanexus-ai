let pineconeClient = null;
let pineconeIndex = null;

async function initializePinecone() {
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_ENVIRONMENT && process.env.PINECONE_INDEX_NAME) {
        try {
            pineconeClient = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY,
            });
            pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX_NAME);
            console.log('Pinecone client and index initialized successfully.');
        } catch (error) {
            console.error('Error initializing Pinecone:', error);
            pineconeClient = null;
            pineconeIndex = null;
        }
    } else {
        console.warn('Pinecone environment variables (PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME) not found. Pinecone features will be disabled.');
    }
}


require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Load .env file variables
console.log('Environment variables loaded:');
console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'Loaded' : 'Not Loaded');
console.log('PINECONE_ENVIRONMENT:', process.env.PINECONE_ENVIRONMENT ? 'Loaded' : 'Not Loaded');
console.log('PINECONE_INDEX_NAME:', process.env.PINECONE_INDEX_NAME ? 'Loaded' : 'Not Loaded');
console.log('ASSISTANT_NAME:', process.env.ASSISTANT_NAME ? 'Loaded' : 'Not Loaded');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Loaded' : 'Not Loaded');
const express = require('express');
const cors =require('cors');

const fetch = require('node-fetch'); // For CoinGecko API
const { GoogleGenerativeAI } = require('@google/generative-ai'); // For Gemini AI
const { Pinecone } = require('@pinecone-database/pinecone'); // For Pinecone Assistant
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs').promises; // For file system operations
const path = require('path'); // For path manipulation

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve index.html for all other GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});


// --- Persistent Chat History ---
const CHAT_HISTORY_FILE = path.join(__dirname, 'chat_history.json');

async function loadChatHistoryFromFile() {
    try {
        await fs.access(CHAT_HISTORY_FILE);
        const fileContent = await fs.readFile(CHAT_HISTORY_FILE, 'utf-8');
        if (!fileContent.trim()) {
            return []; // File is empty or whitespace
        }
        let historyData;
        try {
            historyData = JSON.parse(fileContent);
        } catch (parseError) {
            console.error('Error parsing chat history file content. Starting with empty history.', parseError);
            return []; // Return empty history if parsing fails
        }

        if (!Array.isArray(historyData)) {
            console.warn('Chat history file content is not an array. Starting with empty history.');
            return [];
        }
        
        // Convert to Gemini Content[] format
        return historyData.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Chat history file not found, starting fresh.');
            return [];
        }
        console.error('Error loading chat history:', error);
        return []; // Return empty history on other errors
    }
}

async function saveMessageToHistoryFile(userText, aiText) {
    let history = [];
    try {
        await fs.access(CHAT_HISTORY_FILE);
        const fileContent = await fs.readFile(CHAT_HISTORY_FILE, 'utf-8');
        if (fileContent.trim()) {
           try {
               history = JSON.parse(fileContent);
               if (!Array.isArray(history)) { 
                   console.warn('Chat history file content was not an array. Resetting history for this save.');
                   history = [];
               }
           } catch (parseError) {
               console.error('Error parsing chat history file during save. File might be corrupted. Resetting history for this save operation.', parseError);
               // Optionally, could back up the corrupted file here:
               // await fs.copyFile(CHAT_HISTORY_FILE, `${CHAT_HISTORY_FILE}.corrupted.${Date.now()}`).catch(e => console.error("Backup failed",e));
               history = []; 
           }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') { 
            console.error('Error reading chat history for saving (non-ENOENT):', error);
            // If read fails critically, might be better not to overwrite with partial data
            // For now, we'll proceed assuming we can start a new history if needed.
        }
        // If ENOENT, history remains [], which is fine for a new file.
    }

    // Ensure history is an array before pushing (e.g., if it was reset above)
    if (!Array.isArray(history)) {
        console.error('Chat history is not an array before push operation. Resetting to empty array.');
        history = [];
    }

    history.push({ role: 'user', text: userText, timestamp: new Date().toISOString() });
    history.push({ role: 'model', text: aiText, timestamp: new Date().toISOString() });

    try {
        await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
    } catch (error) {
        console.error('Critical error writing chat history to file:', error);
        // This is a critical failure point for persistence.
        // Depending on requirements, you might implement more advanced recovery or alerting.
    }
}




// --- Gemini AI Initialization ---
let geminiAI = null;
let serverChatSession = null; // For the global chat bubble

// Pinecone Assistant Initialization
let pineconeAssistant = null;

async function initializePineconeAssistant() {
    if (process.env.PINECONE_API_KEY && process.env.ASSISTANT_NAME) {
        try {
            const pinecone = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY,
            });
            pineconeAssistant = pinecone.assistant({
                assistantName: process.env.ASSISTANT_NAME,
            });
            console.log('Pinecone Assistant initialized successfully.');
        } catch (error) {
            console.error('Error initializing Pinecone Assistant:', error);
            pineconeAssistant = null;
        }
    } else {
        console.warn('Pinecone environment variables (PINECONE_API_KEY, ASSISTANT_NAME) not found. Pinecone Assistant features will be disabled.');
    }
}

async function initializeGeminiAI() {
    if (process.env.GEMINI_API_KEY) {
        try {
            geminiAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
            console.log('Google Gemini AI SDK initialized successfully for backend.');
            
            const model = geminiAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });
            serverChatSession = model.startChat({
                history: []
            });
            console.log(`Backend chat session for bubble initialized with empty history.`);

        } catch (error) {
            console.error('Error initializing Google Gemini AI SDK for backend:', error);
            geminiAI = null;
            serverChatSession = null;
        }
    } else {
        console.warn('GEMINI_API_KEY not found in .env. AI features will be disabled.');
    }
}


// In-memory data store (excluding wiki pages now)
let db = {
    calendarEvents: [],
    notifications: [],
};

// Helper function to determine if query should be handled by Pinecone Assistant
const shouldUsePineconeAssistant = (query) => {
    // Implement your criteria logic here
    // Examples:
    // - Query contains specific keywords
    // - Query length exceeds certain threshold
    // - Query matches certain patterns

    // Sample implementation (customize based on your needs):
    const triggerKeywords = ['database', 'document', 'information', 'find', 'search', 'help', 'pinecone'];
    return triggerKeywords.some(keyword => query.toLowerCase().includes(keyword));
};

function createDummyData() {
    db.calendarEvents = [
        { id: 1, time: "09:00 AM", title: "Company All-Hands" },
        { id: 2, time: "11:30 AM", title: "Marketing Sync-Up" },
        { id: 3, time: "03:00 PM", title: "Product Roadmap Review" }
    ];
    db.notifications = [
        { id: 1, message: "New security update available. Please update your devices.", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        { id: 2, message: "Q3 Financial Results published on the portal.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { id: 3, message: "Reminder: Annual Performance Reviews due next week.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }
    ];
    console.log("Dummy data created for Node.js server (Calendar, Notifications).");
}

// --- Simulated Embedding Function ---
function getSimulatedEmbedding(text) {
    if (!text) return Array(SIMULATED_EMBEDDING_DIMENSION).fill(0).map(Math.random);
    const embedding = [];
    for (let i = 0; i < SIMULATED_EMBEDDING_DIMENSION; i++) {
        embedding.push(Math.random());
    }
    return embedding;
}


// --- API Routes ---

// Dashboard: Calendar and Notifications
app.get('/api/dashboard', (req, res) => {
    res.json({
        calendar_events: db.calendarEvents,
        notifications: db.notifications
    });
});

// Pinecone Chat API
app.post('/api/ai/chat/pinecone', async (req, res) => {
    const { message } = req.body;

    if (!pineconeIndex) {
        return res.status(500).json({ error: 'Pinecone not initialized.' });
    }

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        // Here you would typically query your Pinecone index with the user's message
        // and then use an LLM to generate a response based on the retrieved context.
        // For this example, we'll just return a placeholder response.
        
        // Simulate a query to Pinecone
        console.log(`Querying Pinecone with message: "${message}"`);
        // In a real application, you'd use pineconeIndex.query() here
        // const queryResult = await pineconeIndex.query({ /* ... query parameters ... */ });

        // Simulate LLM response generation based on retrieved context
        const aiResponse = `This is a simulated response from Pinecone for your message: "${message}".`;

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error('Error in Pinecone chat endpoint:', error);
        res.status(500).json({ error: 'Failed to get response from Pinecone.' });
    }
});

// Google Auth Verification
app.post('/api/verify-google-token', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'Credential not provided' });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        // If request specified a G Suite domain: 
        // const domain = payload['hd'];

        console.log('Google ID token verified. User ID:', userid);
        res.json({ success: true, message: 'Authentication successful', user: payload });
    } catch (error) {
        console.error('Error verifying Google ID token:', error);
        res.status(401).json({ success: false, message: 'Authentication failed', error: error.message });
    }
});

// Weather
app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    const defaultLocationName = "Copenhagen, Denmark";
    const defaultTemp = 12; 
    const defaultCondition = "Partly Cloudy";

    if (process.env.OPENWEATHERMAP_API_KEY && lat && lon) {
        const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`;
        try {
            const owmResponse = await fetch(owmUrl);
            if (!owmResponse.ok) {
                console.error(`OpenWeatherMap API error: ${owmResponse.status}`);
                throw new Error(`Failed to fetch weather from OpenWeatherMap. Status: ${owmResponse.status}`);
            }
            const weatherData = await owmResponse.json();
            res.json({
                temperature: weatherData.main.temp,
                condition: weatherData.weather[0].description,
                location: weatherData.name
            });
        } catch (error) {
            console.error('Error fetching real weather data:', error);
            res.json({
                temperature: defaultTemp,
                condition: defaultCondition,
                location: defaultLocationName + " (API fallback)"
            });
        }
    } else {
         if (!process.env.OPENWEATHERMAP_API_KEY && lat && lon) {
            console.warn("OPENWEATHERMAP_API_KEY not set, but lat/lon provided. Sending mock dynamic data.");
             res.json({
                temperature: Math.floor(5 + Math.random() * 15), 
                condition: "Varied Conditions (mocked)",
                location: `Weather for ${parseFloat(lat).toFixed(2)}, ${parseFloat(lon).toFixed(2)} (mocked)`
            });
        } else {
            console.log("Fetching default weather for Copenhagen (mocked or OPENWEATHERMAP_API_KEY missing).");
            res.json({
                temperature: defaultTemp,
                condition: defaultCondition,
                location: defaultLocationName
            });
        }
    }
});


// Crypto Prices (CoinGecko Integration)
app.get('/api/crypto/:pair', async (req, res) => {
    const pair = req.params.pair.toUpperCase();
    let coinId = '';

    if (pair === 'BTCUSD') {
        coinId = 'bitcoin';
    } else if (pair === 'ETHUSD') {
        coinId = 'ethereum';
    } else {
        return res.status(404).json({ error: "Cryptocurrency pair not supported" });
    }

    const coingeckoURL = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;

    try {
        const response = await fetch(coingeckoURL);
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`CoinGecko API error for ${pair}: ${response.status}`, errorBody);
            throw new Error(`Failed to fetch data from CoinGecko. Status: ${response.status}`);
        }
        const data = await response.json();

        if (data[coinId] && data[coinId].usd !== undefined && data[coinId].usd_24h_change !== undefined) {
            res.json({
                pair: pair,
                price: data[coinId].usd.toFixed(2),
                change_percent: data[coinId].usd_24h_change.toFixed(2)
            });
        } else {
            console.error(`CoinGecko response format error for ${pair}:`, data);
            throw new Error("Unexpected data format from CoinGecko API.");
        }
    } catch (error) {
        console.error(`Error fetching crypto data for ${pair}:`, error);
        res.status(500).json({ error: `Failed to fetch cryptocurrency data for ${pair}. ${error.message}` });
    }
});

// AI Explanation for Crypto (Gemini API via Backend)
app.post('/api/ai/explain-crypto', async (req, res) => {
    if (!geminiAI) {
        return res.status(503).json({ error: "AI service not available. GEMINI_API_KEY might be missing or invalid on backend." });
    }
    const { pairSymbol, price, changePercent } = req.body;
    if (!pairSymbol || price === undefined || changePercent === undefined) {
        return res.status(400).json({ error: "Missing required data for AI explanation (pairSymbol, price, changePercent)." });
    }

    try {
        const prompt = `Explain the current price and recent change for ${pairSymbol}. Current price: $${price}, 24h change: ${changePercent}%. Keep it concise (1-2 sentences), friendly, and easy to understand for a general audience.`;
        
        const response = await geminiAI.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17", 
            contents: prompt,
        });
        const textResponse = response.text;

        if (textResponse) {
            res.json({ explanation: textResponse.trim() });
        } else {
            throw new Error("No explanation content received from Gemini API.");
        }
    } catch (error) {
        console.error('Error getting AI explanation from Gemini:', error);
        res.status(500).json({ error: `Failed to get AI explanation. ${error.message}` });
    }
});

// Get Chat History
app.get('/api/ai/chat/history', async (req, res) => {
    try {
        await fs.access(CHAT_HISTORY_FILE);
        const fileContent = await fs.readFile(CHAT_HISTORY_FILE, 'utf-8');
        if (!fileContent.trim()) {
            return res.json([]);
        }
        let historyData;
        try {
            historyData = JSON.parse(fileContent);
        } catch (parseError) {
            console.error('Error parsing chat history file for GET request:', parseError);
            return res.status(500).json({ error: "Failed to parse chat history data."});
        }

        if (!Array.isArray(historyData)) {
             console.warn('Chat history data for GET request is not an array.');
             return res.status(500).json({ error: "Chat history data is malformed."});
        }
        
        // Convert to frontend ChatMessage[] format
        const frontendHistory = historyData.map((msg, index) => ({
            id: `hist-${index}-${msg.role}-${new Date(msg.timestamp || Date.now()).getTime()}`, // Ensure timestamp exists
            text: msg.text,
            sender: msg.role === 'user' ? 'user' : 'ai',
            timestamp: msg.timestamp || new Date().toISOString()
        }));
        res.json(frontendHistory);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.json([]); // No history file, return empty
        } else {
            console.error('Error fetching chat history:', error);
            res.status(500).json({ error: "Failed to fetch chat history." });
        }
    }
});

// API endpoint for handling Pinecone queries
app.post('/api/pinecone-query', async (req, res) => {
    try {
        const { query, forceAssistant = false } = req.body;

        if (!pineconeAssistant) {
            return res.status(503).json({ error: 'Pinecone Assistant not initialized.' });
        }

        // Check if query should be handled by Pinecone Assistant
        if (forceAssistant || shouldUsePineconeAssistant(query)) {
            // Create a message for the assistant
            const message = {
                role: 'user',
                content: query
            };

            // Send query to Pinecone Assistant
            const response = await pineconeAssistant.chat({
                messages: [message]
            });

            return res.json({
                source: 'pinecone',
                response: response.message.content,
                citations: response.citations || []
            });
        } else {
            // If not forced and criteria not met, return a default response or error
            return res.status(400).json({ source: 'default', response: 'Query does not meet Pinecone Assistant criteria.' });
        }
    } catch (error) {
        console.error('Error processing Pinecone query:', error);
        res.status(500).json({ error: 'Failed to process Pinecone query' });
    }
});

// Chat Bubble AI (Gemini API via Backend - Streaming)
app.post('/api/ai/chat/send', async (req, res) => {

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Missing message for AI chat." });
    }

    console.log(`[Chat API] Received message: "${message}"`);
    let aggregatedResponse = "";

    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return res.status(503).json({ error: "OpenRouter API key not found." });
        }

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://rp9hwiqc1goj.manus.space", // Replace with your actual site URL
                "X-Title": "DataNexus", // Replace with your actual site name
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-r1:free",
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ]
            })
        });

        if (!openRouterResponse.ok) {
            const errorData = await openRouterResponse.json();
            console.error('OpenRouter API error:', errorData);
            return res.status(openRouterResponse.status).json({ error: `OpenRouter API error: ${errorData.message || openRouterResponse.statusText}` });
        }

        const data = await openRouterResponse.json();
        const aiResponseText = data.choices[0].message.content;

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write(aiResponseText);
        res.end();

        aggregatedResponse = aiResponseText;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        for await (const chunk of stream) {
            if (chunk && chunk.text) {
                aggregatedResponse += chunk.text;
                res.write(chunk.text); 
            }
        }
        console.log('[Chat API] Stream finished.');
        res.end();

        // After stream is finished and res.end() is called, save the conversation turn.
        await saveMessageToHistoryFile(message, aggregatedResponse);
        console.log(`[Chat API] Saved message and response to history file.`);

    } catch (error) {
        console.error('[Chat API] Error processing chat message with Gemini:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: `Failed to process chat message. ${error.message || 'Unknown error'}` });
        } else {
            console.error('[Chat API] Headers already sent, cannot send JSON error to client. Ending stream.');
            res.end(); // Ensure stream is closed on error if headers sent
        }
         // Save an error placeholder to history if something went wrong.
        if (aggregatedResponse) { // If we got partial response
            await saveMessageToHistoryFile(message, aggregatedResponse + "\n[Error during streaming, AI response may be incomplete]");
        } else { // If no response at all before error
             await saveMessageToHistoryFile(message, "[AI failed to respond due to an error. No content generated.]");
        }
    }
});


// AI Chat Endpoint
app.post('/api/ai/chat/send', async (req, res) => {
  const userMessage = req.body.message;
  const selectedApi = req.body.api; // Get the selected API from the frontend

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Add user message to history
  chatHistory.push({ role: 'user', parts: [{ text: userMessage }], timestamp: new Date().toISOString() });
  saveChatHistory();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    let aiResponseText = '';

    if (selectedApi === 'gemini') {
      // Gemini API integration
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables.');
      }
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = model.startChat({
        history: chatHistory.map(msg => ({
          role: msg.role,
          parts: msg.parts,
        })),
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      const result = await chat.sendMessageStream(userMessage);
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        aiResponseText += chunkText;
        res.write(chunkText);
      }
    } else if (selectedApi === 'openrouter') {
      // OpenRouter API integration
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
      if (!OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
      }

      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat", // Using deepseek-chat as it's a common free model
          messages: [
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.parts[0].text })),
            { role: "user", content: userMessage }
          ],
          stream: true,
        }),
      });

      if (!openRouterResponse.ok) {
        const errorData = await openRouterResponse.json();
        throw new Error(`OpenRouter API error: ${openRouterResponse.status} - ${errorData.message || JSON.stringify(errorData)}`);
      }

      const reader = openRouterResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process each line
        let lastNewlineIndex = buffer.lastIndexOf('\n');
        while (lastNewlineIndex !== -1) {
          const line = buffer.substring(0, lastNewlineIndex).trim();
          buffer = buffer.substring(lastNewlineIndex + 1);

          if (line.startsWith('data:')) {
            const jsonStr = line.substring(5).trim();
            if (jsonStr === '[DONE]') {
              res.end();
              return;
            }
            try {
              const data = JSON.parse(jsonStr);
              const content = data.choices[0].delta.content || '';
              aiResponseText += content;
              res.write(content);
            } catch (parseError) {
              console.error('Error parsing OpenRouter stream chunk:', parseError);
            }
          }
          lastNewlineIndex = buffer.lastIndexOf('\n');
        }
      }
      // Handle any remaining buffer after stream ends
      if (buffer.startsWith('data:')) {
        const jsonStr = buffer.substring(5).trim();
        if (jsonStr !== '[DONE]') {
          try {
            const data = JSON.parse(jsonStr);
            const content = data.choices[0].delta.content || '';
            aiResponseText += content;
            res.write(content);
          } catch (parseError) {
            console.error('Error parsing final OpenRouter stream chunk:', parseError);
          }
        }
      }
    } else if (selectedApi === 'pinecone') {
      // Pinecone API integration
      if (!pineconeIndex) {
        throw new Error('Pinecone is not initialized.');
      }
      try {
        const pineconeChatResponse = await fetch(`http://localhost:${PORT}/api/ai/chat/pinecone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: userMessage })
        });

        if (!pineconeChatResponse.ok) {
          const errorData = await pineconeChatResponse.json();
          throw new Error(`Pinecone chat API error: ${pineconeChatResponse.status} - ${errorData.message || JSON.stringify(errorData)}`);
        }

        const data = await pineconeChatResponse.json();
        aiResponseText = data.reply;
        res.write(aiResponseText);
      } catch (error) {
        console.error('Error communicating with Pinecone chat endpoint:', error);
        throw new Error('Failed to get response from Pinecone chat endpoint.');
      }
    } else {
      throw new Error('Invalid API selected. Please choose either "gemini" or "openrouter".');
    }

    // Save AI response to history
    chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }], timestamp: new Date().toISOString() });
    saveChatHistory();
    res.end();

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    } else {
      res.write(`data: {\"error\": \"${error.message || 'Internal server error'}\"}\n\n`);
      res.end();
    }
  }
});

// --- Server Start ---
app.listen(PORT, async () => {
    createDummyData(); 
    await initializeGeminiAI(); // Initialize Gemini AI and chat session
    await initializePineconeAssistant();
    await initializePinecone(); // Initialize Pinecone client and index
    console.log(`Node.js Express server listening on http://localhost:${PORT}`);
    console.log(`Persistent chat history will be stored in: ${CHAT_HISTORY_FILE}`);
    console.log("IMPORTANT: The chat_history.json persistence is for demonstration and not suitable for production. Use a proper database for production deployments.");
});
    