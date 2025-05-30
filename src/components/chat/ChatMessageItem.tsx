import React from 'react';
import { ChatMessage } from '../../types';

interface ChatMessageItemProps {
  message: ChatMessage;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({ message }) => {
  const messageClass = message.sender === 'user' ? 'user-message' : 'ai-message';
  
  return (
    <div className={`chat-message ${messageClass}`} role="log" aria-live={message.sender === 'ai' ? 'polite' : undefined}>
      <div className="message-content">
        {message.text || (message.isStreaming ? '...' : '')}
      </div>
      <span className="message-timestamp">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
});

export default ChatMessageItem;
