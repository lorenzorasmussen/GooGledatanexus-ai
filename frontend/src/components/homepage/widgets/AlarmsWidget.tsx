import React, { useState, useEffect } from 'react';
import './AlarmsWidget.css';

interface Alarm {
  id: string;
  time: string;
  label: string;
}

const AlarmsWidget: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate fetching alarms from a service or API
        await new Promise(resolve => setTimeout(resolve, 800));

        const dummyAlarms: Alarm[] = [
          { id: 'a1', time: '07:00 AM', label: 'Wake up' },
          { id: 'a2', time: '09:30 AM', label: 'Stand-up meeting' },
        ];
        setAlarms(dummyAlarms);
      } catch (err) {
        setError("Failed to fetch alarms");
        console.error("Alarms fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlarms();
  }, []);

  return (
    <div className="widget alarms-widget glass-panel">
      <div className="widget-header">
        <h3>Alarms</h3>
      </div>
      <div className="widget-content">
        {loading && <p>Loading alarms...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && alarms.length === 0 && <p>No active alarms.</p>}
        {!loading && !error && alarms.length > 0 && (
          <ul className="alarms-list">
            {alarms.map((alarm) => (
              <li key={alarm.id} className="alarm-item">
                <span className="alarm-time">{alarm.time}</span>
                <span className="alarm-label">{alarm.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AlarmsWidget;