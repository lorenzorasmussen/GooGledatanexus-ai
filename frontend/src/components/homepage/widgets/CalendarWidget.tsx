import React from 'react';
import './CalendarWidget.css';

const CalendarWidget: React.FC = () => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

  return (
    <div className="widget calendar-widget glass-panel">
      <div className="widget-header">
        <h3>Today's Date</h3>
      </div>
      <div className="widget-content">
        <p className="calendar-date">{today.toLocaleDateString(undefined, options)}</p>
        {/* A more complex calendar view could be integrated here */}
      </div>
    </div>
  );
};

export default CalendarWidget;