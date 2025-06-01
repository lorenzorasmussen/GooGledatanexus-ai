
require('dotenv').config(); // Load .env file variables
const express = require('express');
const cors =require('cors');
const { Pinecone } = require('@pinecone-database/pinecone');
const fetch = require('node-fetch'); // For CoinGecko API
const { GoogleGenAI, Chat } = require('@google/genai'); // For Gemini API
const fs = require('fs').promises; // For file system operations
const path = require('path'); // For path manipulation

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, 'dist')));

// All other GET requests not handled by API routes should return the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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


// --- Pinecone Initialization ---
let pineconeClient = null;
let pineconeIndex = null;
const PINECONE_INDEX_NAME = 'company-wiki';
const SIMULATED_EMBEDDING_DIMENSION = 10; // Placeholder dimension

async function initializePinecone() {
    try {
        if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENVIRONMENT) {
            console.warn('Pinecone API Key or Environment not found in .env. Pinecone features will be disabled.');
            return;
        }
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
            environment: process.env.PINECONE_ENVIRONMENT,
        });
        
        pineconeIndex = pineconeClient.Index(PINECONE_INDEX_NAME);
        console.log(`Successfully connected to Pinecone index: ${PINECONE_INDEX_NAME}`);
    } catch (error) {
        console.error('Error initializing Pinecone:', error);
        pineconeClient = null;
        pineconeIndex = null;
    }
}

// --- Gemini AI Initialization ---
let geminiAI = null;
let serverChatSession = null; // For the global chat bubble

async function initializeGeminiAI() {
    if (process.env.GEMINI_API_KEY) {
        try {
            geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            console.log('Google Gemini AI SDK initialized successfully for backend.');
            
            let loadedHistory = await loadChatHistoryFromFile(); // Uses the more robust loader

            if (loadedHistory.length === 0) {
                const welcomeText = "Hello! I am your AI assistant. How can I help you today?";
                const welcomeAiMessageForSdk = { role: 'model', parts: [{ text: welcomeText }] };
                
                // Persist this welcome message to the file
                // Using a simplified array for initial file state. saveMessageToHistoryFile expects two messages.
                const initialHistoryStateForFile = [{ role: 'model', text: welcomeText, timestamp: new Date().toISOString() }];
                try {
                    await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(initialHistoryStateForFile, null, 2), 'utf-8');
                    console.log('Initialized new chat history with a welcome message.');
                    // The loadedHistory for the SDK should reflect this welcome message
                    loadedHistory = [{ role: 'model', parts: [{ text: welcomeText }] }];
                } catch (fileError) {
                    console.error('Failed to write initial welcome message to chat history file:', fileError);
                    // Continue without persisted welcome message if file write fails, session will still get it
                    // but it won't be saved until next interaction.
                    loadedHistory.push(welcomeAiMessageForSdk); // Add to current session's history if file write failed
                }
            }
            
            serverChatSession = geminiAI.chats.create({ 
                model: 'gemini-2.5-flash-preview-04-17',
                history: loadedHistory 
            });
            console.log(`Backend chat session for bubble initialized. Loaded ${loadedHistory.length} message(s) into current session.`);

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

// Chat Bubble AI (Gemini API via Backend - Streaming)
app.post('/api/ai/chat/send', async (req, res) => {
    if (!serverChatSession) {
        console.error('Chat API: serverChatSession is not initialized.');
        return res.status(503).json({ error: "AI Chat service not available. Initialization may have failed or API key is missing." });
    }
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Missing message for AI chat." });
    }

    console.log(`[Chat API] Received message: "${message}"`);
    let aggregatedResponse = "";

    try {
        const stream = await serverChatSession.sendMessageStream({ message: message });
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


// --- Wiki API Routes (Pinecone Based) ---

// Wiki: Search pages
app.post('/api/wiki/search', async (req, res) => {
    if (!pineconeIndex) {
        return res.status(503).json({ error: "Pinecone service not available." });
    }
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Search query is required." });
    }

    try {
        const queryEmbedding = getSimulatedEmbedding(query);
        const searchResponse = await pineconeIndex.query({
            vector: queryEmbedding,
            topK: 10,
            includeMetadata: true,
        });
        
        const results = searchResponse.matches.map(match => ({
            id: match.id,
            score: match.score,
            title: match.metadata?.title,
        }));
        res.json(results);
    } catch (error) {
        console.error('Error searching wiki in Pinecone:', error);
        res.status(500).json({ error: "Failed to search wiki pages." });
    }
});

// Wiki: Get a specific page by ID
app.get('/api/wiki/:page_id', async (req, res) => {
    if (!pineconeIndex) {
        return res.status(503).json({ error: "Pinecone service not available." });
    }
    const pageId = req.params.page_id;
    try {
        const fetchResponse = await pineconeIndex.fetch([pageId]);
        const record = fetchResponse.records[pageId];

        if (record && record.metadata) {
            res.json({
                id: record.id,
                title: record.metadata.title,
                content_md: record.metadata.content_md,
            });
        } else {
            res.status(404).json({ error: "Wiki page not found." });
        }
    } catch (error) {
        console.error(`Error fetching wiki page ${pageId} from Pinecone:`, error);
        res.status(500).json({ error: "Failed to fetch wiki page." });
    }
});

// Wiki: Create/Update a page (Upsert)
app.post('/api/wiki', async (req, res) => {
    if (!pineconeIndex) {
        return res.status(503).json({ error: "Pinecone service not available." });
    }
    const { title, content_md, id } = req.body; 
    if (!title || !content_md) {
        return res.status(400).json({ error: "Title and content_md are required." });
    }

    const pageId = id || `wiki-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const embedding = getSimulatedEmbedding(title + "\n" + content_md); 

    try {
        await pineconeIndex.upsert([{
            id: pageId,
            values: embedding,
            metadata: {
                title: title,
                content_md: content_md,
                updated_at: new Date().toISOString()
            }
        }]);
        res.status(201).json({ id: pageId, title, content_md });
    } catch (error) {
        console.error('Error upserting page to Pinecone:', error);
        res.status(500).json({ error: "Failed to create/update wiki page." });
    }
});

// Wiki: List some pages
app.get('/api/wiki', async (req, res) => {
    if (!pineconeIndex) {
        return res.status(503).json({ error: "Pinecone service not available." });
    }
    try {
        const genericEmbedding = getSimulatedEmbedding("general content"); 
        const listResponse = await pineconeIndex.query({
            vector: genericEmbedding,
            topK: 5,
            includeMetadata: true,
        });

        const pages = listResponse.matches.map(match => ({
            id: match.id,
            title: match.metadata?.title,
        }));
        res.json(pages);
    } catch (error) {
        console.error('Error listing sample wiki pages from Pinecone:', error);
        res.status(500).json({ error: "Failed to list sample wiki pages." });
    }
});


// --- Server Start ---
app.listen(PORT, async () => {
    createDummyData(); 
    await initializePinecone(); 
    await initializeGeminiAI(); // Initialize Gemini AI and chat session
    console.log(`Node.js Express server listening on http://localhost:${PORT}`);
    console.log(`Persistent chat history will be stored in: ${CHAT_HISTORY_FILE}`);
    console.log("IMPORTANT: The chat_history.json persistence is for demonstration and not suitable for production. Use a proper database for production deployments.");
});
    