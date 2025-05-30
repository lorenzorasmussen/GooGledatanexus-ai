
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatViewContainer from './ChatViewContainer'; // The actual chat UI

const chatIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.74 8.74 0 01-4.246-1.122L2.692 17.308a1 1 0 01-1.39-1.445l1.624-2.43A7.954 7.954 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clip-rule="evenodd"></path></svg>`;
const minimizeIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>`;


const ChatBubble: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent drag on buttons or input fields within the expanded view.
    // Check if the target is the header or the icon itself
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('textarea') || target.closest('.chat-messages-area')) {
        if (isExpanded && !target.closest('.chat-bubble-header') && !target.closest('.chat-bubble-icon')) {
           return; // Don't drag if clicking inside content of expanded bubble, unless it's the header
        }
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    // Add user-select: none to body to prevent text selection during drag
    document.body.style.userSelect = 'none';
  }, [position, isExpanded]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !bubbleRef.current) return;
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    // Constrain to viewport
    const bubbleWidth = bubbleRef.current.offsetWidth;
    const bubbleHeight = bubbleRef.current.offsetHeight;
    newX = Math.max(0, Math.min(newX, window.innerWidth - bubbleWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - bubbleHeight));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = ''; // Re-enable text selection
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Adjust initial position if it's off-screen on mount (e.g. after window resize and reload)
   useEffect(() => {
    if (bubbleRef.current) {
        const bubbleWidth = bubbleRef.current.offsetWidth;
        const bubbleHeight = bubbleRef.current.offsetHeight;
        const x = Math.max(0, Math.min(position.x, window.innerWidth - bubbleWidth -10)); // 10px buffer
        const y = Math.max(0, Math.min(position.y, window.innerHeight - bubbleHeight -10));
        if (x !== position.x || y !== position.y) {
            setPosition({ x, y });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]); // Re-check on expand/collapse as size changes


  return (
    <div
      ref={bubbleRef}
      className={`chat-bubble-wrapper glass-panel ${isExpanded ? 'chat-bubble-expanded' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
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
