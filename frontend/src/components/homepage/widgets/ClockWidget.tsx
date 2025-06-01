import React, { useState, useEffect } from 'react';
import './ClockWidget.css';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="widget clock-widget glass-panel">
      <div className="widget-header">
        <h3>Current Time</h3>
      </div>
      <div className="widget-content">
        <p className="clock-time">{formatTime(time)}</p>
      </div>
    </div>
  );
};

export default ClockWidget;