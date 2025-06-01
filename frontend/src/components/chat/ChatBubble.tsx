
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatViewContainer from './ChatViewContainer'; // The actual chat UI
import './ChatBubble.css';

const chatIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.74 8.74 0 01-4.246-1.122L2.692 17.308a1 1 0 01-1.39-1.445l1.624-2.43A7.954 7.954 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clip-rule="evenodd"></path></svg>`;
const minimizeIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>`;


const ChatBubble: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div
      ref={bubbleRef}
      className={`chat-bubble-wrapper glass-panel ${isExpanded ? 'chat-bubble-expanded' : ''}`}
    >
      {!isExpanded ? (
        <div className="chat-bubble-icon" onClick={toggleExpand} role="button" aria-label="Open Chat AI">
          <span dangerouslySetInnerHTML={{ __html: chatIconSVG }} />
        </div>
      ) : (
        <>
          <div className="chat-bubble-header">
            <h4>Chat AI</h4>
            <button onClick={toggleExpand} aria-label="Minimize Chat AI">
              <span dangerouslySetInnerHTML={{ __html: minimizeIconSVG }} />
            </button>
          </div>
          <ChatViewContainer />
        </>
      )}
    </div>
  );
};

export default ChatBubble;
