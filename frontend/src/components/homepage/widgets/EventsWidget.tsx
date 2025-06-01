import React, { useState, useEffect } from 'react';
import './EventsWidget.css';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
}

const EventsWidget: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate fetching events from an API
        await new Promise(resolve => setTimeout(resolve, 1000));

        const dummyEvents: Event[] = [
          { id: '1', title: 'Team Meeting', date: '2024-07-20', time: '10:00 AM' },
          { id: '2', title: 'Project Deadline', date: '2024-07-25', time: '05:00 PM' },
          { id: '3', title: 'Client Presentation', date: '2024-07-28', time: '02:00 PM' },
        ];
        setEvents(dummyEvents);
      } catch (err) {
        setError("Failed to fetch events");
        console.error("Events fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="widget events-widget glass-panel">
      <div className="widget-header">
        <h3>Upcoming Events</h3>
      </div>
      <div className="widget-content">
        {loading && <p>Loading events...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && events.length === 0 && <p>No upcoming events.</p>}
        {!loading && !error && events.length > 0 && (
          <ul className="events-list">
            {events.map((event) => (
              <li key={event.id} className="event-item">
                <div className="event-title">{event.title}</div>
                <div className="event-datetime">{event.date} at {event.time}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EventsWidget;