
import React, { useState, useEffect } from 'react';
import Widget from '../../Widget';
import { API_BASE_URL, loadingSVG, errorSVG } from '@/utils';
import { CalendarEvent, Notification } from '@/types';

const calendarIcon = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>`;
// const notificationsIcon = `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 12.586V8a6 6 0 00-6-6zm0 16a2 2 0 002-2H8a2 2 0 002 2z"></path></svg>`; // Icon can be for the whole widget

interface DashboardData {
  calendar_events: CalendarEvent[];
  notifications: Notification[];
}

const DashboardOverviewWidgets: React.FC = () => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard`);
        if (!response.ok) {
          // Try to parse error from backend if it's JSON, otherwise use status text
          let errorResponseMessage = `HTTP error! status: ${response.status} ${response.statusText}.`;
          try {
              const errorData = await response.json();
              errorResponseMessage = errorData.error || errorData.message || errorResponseMessage;
          } catch (parseError) {
              // console.warn("Could not parse error response as JSON:", parseError);
          }
          throw new Error(errorResponseMessage);
        }
        const data: DashboardData = await response.json();
        setCalendarEvents(data.calendar_events || []);
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        let specificMessage = "Failed to load dashboard data.";
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          specificMessage = `Failed to connect to the server at ${API_BASE_URL} to load dashboard data. Please ensure the backend server (server.js) is running and accessible.`;
        } else if (err instanceof Error) {
          specificMessage = `Error loading dashboard data: ${err.message}. Please check the backend server at ${API_BASE_URL} or your network.`;
        } else {
          specificMessage = `An unknown error occurred while loading dashboard data. Please check the backend server at ${API_BASE_URL}.`;
        }
        setError(specificMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderEventList = (items: any[], type: 'calendar' | 'notifications') => {
    if (!items.length) {
      return <p style={{fontSize: '0.8rem', color: 'var(--color-text-disabled)'}}>{type === 'calendar' ? 'No upcoming events.' : 'No new notifications.'}</p>;
    }
    return (
      <ul>
        {items.map((item, index) => (
          <li key={item.id || index}>
            {type === 'calendar' && <span className="event-time">{(item as CalendarEvent).time}</span>}
             <span className={type === 'notifications' ? 'notification-message' : ''} title={type === 'notifications' ? (item as Notification).message : undefined}>
              {type === 'calendar' ? (item as CalendarEvent).title : (item as Notification).message}
            </span>
            {type === 'notifications' && (item as Notification).timestamp && (
              <span className="notification-time">
                {new Date((item as Notification).timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  };
  
  if (isLoading) {
    return (
        <Widget title="Daily Overview" iconSvg={calendarIcon} customClasses="long-tile-widget">
            <div className="loading-state" dangerouslySetInnerHTML={{ __html: loadingSVG + `<p>Loading overview...</p>` }} />
        </Widget>
    );
  }
  if (error) {
    return (
        <Widget title="Daily Overview" iconSvg={calendarIcon} customClasses="long-tile-widget">
            <div className="error-state" dangerouslySetInnerHTML={{ __html: errorSVG + `<p>${error}</p>` }} />
        </Widget>
    );
  }

  return (
    <Widget title="Daily Overview" iconSvg={calendarIcon} customClasses="long-tile-widget">
        <div className="calendar-section">
            <h4>Today's Agenda</h4>
            {renderEventList(calendarEvents, 'calendar')}
        </div>
        <div className="notifications-section">
            <h4>Recent Notifications</h4>
            {renderEventList(notifications, 'notifications')}
        </div>
    </Widget>
  );
};

export default DashboardOverviewWidgets;
