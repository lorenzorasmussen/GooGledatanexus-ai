import React, { useState, useEffect } from 'react';
import './UnreadMessagesWidget.css';

interface Message {
  id: string;
  sender: string;
  subject: string;
}

const UnreadMessagesWidget: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate fetching unread messages from a service or API
        await new Promise(resolve => setTimeout(resolve, 1200));

        const dummyMessages: Message[] = [
          { id: 'm1', sender: 'Alice', subject: 'Project Update' },
          { id: 'm2', sender: 'Bob', subject: 'Meeting Reminder' },
          { id: 'm3', sender: 'Charlie', subject: 'Feedback Request' },
        ];
        setMessages(dummyMessages);
      } catch (err) {
        setError("Failed to fetch messages");
        console.error("Messages fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  return (
    <div className="widget unread-messages-widget glass-panel">
      <div className="widget-header">
        <h3>Unread Messages</h3>
      </div>
      <div className="widget-content">
        {loading && <p>Loading messages...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && messages.length === 0 && <p>No unread messages.</p>}
        {!loading && !error && messages.length > 0 && (
          <ul className="messages-list">
            {messages.map((message) => (
              <li key={message.id} className="message-item">
                <div className="message-sender">{message.sender}</div>
                <div className="message-subject">{message.subject}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UnreadMessagesWidget;