
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../../types';
import ChatMessageItem from './ChatMessageItem';
import { API_BASE_URL, loadingSVG, errorSVG } from '../../utils'; 

const ChatViewContainer: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For sending message
  const [error, setError] = useState<string | null>(null); // For sending message
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isBackendChatServiceReady, setIsBackendChatServiceReady] = useState(true); // Assume ready initially

  useEffect(() => {
    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      setHistoryError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/chat/history`);
        if (!response.ok) {
          let errorResponseMessage = `Error fetching chat history: ${response.status} ${response.statusText}`;
           try {
            const errorData = await response.json();
            errorResponseMessage = errorData.error || errorData.message || errorResponseMessage;
          } catch (parseError) { /* Do nothing */ }
          throw new Error(errorResponseMessage);
        }
        const history: ChatMessage[] = await response.json();
        // Sort by timestamp just in case, though backend should send in order
        const sortedHistory = history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(sortedHistory);
        setIsBackendChatServiceReady(true);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
        let specificMessage = 'Failed to load chat history.';
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            specificMessage = `Failed to connect to the chat service at ${API_BASE_URL} to load history. Ensure backend is running.`;
        } else if (err instanceof Error) {
            specificMessage = `Error loading chat history: ${err.message}.`;
        }
        setHistoryError(specificMessage);
        setIsBackendChatServiceReady(false); // If history fails, assume service might be down
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);
  
  useEffect(() => { 
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = parseInt(getComputedStyle(textareaRef.current).maxHeight, 10) || Infinity;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !isBackendChatServiceReady) return;
    const userMessageText = inputValue.trim();
    setInputValue('');
    setError(null); // Clear previous send error

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true); 
    setAiTyping(true); 

    const currentAiMessageId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, { id: currentAiMessageId, text: '', sender: 'ai', timestamp: new Date().toISOString(), isStreaming: true }]);
    let currentAiText = '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessageText }),
      });

      if (!response.ok) {
        let errorResponseMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorResponseMessage = errorData.error || errorData.message || errorResponseMessage;
        } catch (parseError) { /* Do nothing */ }
        throw new Error(errorResponseMessage);
      }
      
      if (!response.body) {
        throw new Error('ReadableStream not available from response.');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamingDone = false;

      while (!streamingDone) {
        const { done, value } = await reader.read();
        if (done) {
          streamingDone = true;
          break;
        }
        currentAiText += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(msg => 
          msg.id === currentAiMessageId ? { ...msg, text: currentAiText, isStreaming: true } : msg
        ));
      }
      currentAiText += decoder.decode(undefined, { stream: false }); // Final decode

      setMessages(prev => prev.map(msg => 
        msg.id === currentAiMessageId ? { ...msg, text: currentAiText || "...", isStreaming: false } : msg
      ));
      setIsBackendChatServiceReady(true); // Successful interaction implies service is ready

    } catch (e) {
      console.error('Error sending/receiving chat message:', e);
      let specificMessage = 'An unknown error occurred with the chat service.';
      if (e instanceof TypeError && e.message === 'Failed to fetch') {
        specificMessage = `Failed to connect to the chat service at ${API_BASE_URL}. Please ensure the backend server (server.js) is running and accessible.`;
        setIsBackendChatServiceReady(false); 
      } else if (e instanceof Error) {
        specificMessage = `Chat service error: ${e.message}. Check the backend server.`;
      }
      setError(specificMessage);
      setMessages(prev => prev.map(msg => 
        msg.id === currentAiMessageId 
          ? { ...msg, text: "I'm having trouble responding right now. Please see the error message below.", isStreaming: false, sender: 'ai' } 
          : msg
      ));
    } finally {
      setIsLoading(false);
      setAiTyping(false);
    }
  }, [inputValue, isLoading, isBackendChatServiceReady]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-view-container">
      <div className="chat-messages-area">
        {isHistoryLoading && (
            <div className="loading-state" style={{position: 'relative'}} dangerouslySetInnerHTML={{ __html: loadingSVG + '<p>Loading chat history...</p>'}}/>
        )}
        {!isHistoryLoading && historyError && (
            <div className="chat-error-message" role="alert" style={{margin: '0.5rem'}}>
                <span dangerouslySetInnerHTML={{__html: errorSVG}} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem'}}/>
                {historyError}
            </div>
        )}
        {!isHistoryLoading && !historyError && messages.length === 0 && (
             <div style={{textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem'}}>
                No messages yet. Start a conversation!
            </div>
        )}
        {messages.map(msg => <ChatMessageItem key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </div>

      {aiTyping && <div className="ai-typing-indicator">AI is typing...</div>}
      {error && !isLoading && <div className="chat-error-message" role="alert">{error}</div>}
      
      {!isBackendChatServiceReady && !error && !historyError && (
         <div className="chat-error-message" role="alert">
            Chat service is currently unavailable. Please try again later.
        </div>
      )}
      
      <div className={`chat-input-area ${!isBackendChatServiceReady ? 'disabled-input-area' : ''}`}>
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isBackendChatServiceReady ? "Type your message..." : "Chat service unavailable"}
          rows={1}
          disabled={isLoading || !isBackendChatServiceReady}
          aria-label="Chat input"
        />
        <button 
          onClick={handleSendMessage} 
          disabled={isLoading || !inputValue.trim() || !isBackendChatServiceReady}
          aria-label="Send message"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatViewContainer;
