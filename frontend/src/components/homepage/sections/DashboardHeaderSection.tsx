import React from 'react';

const DashboardHeaderBar: React.FC = React.memo(() => {
  return (
    <div className="dashboard-header-bar">
      <h1>Dashboard</h1>
      <div className="user-actions">
        <button className="icon-button" title="Search" aria-label="Search">
          <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
        </button>
        <button className="icon-button" title="Notifications" aria-label="Notifications">
          <svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 12.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
        </button>
        <div className="user-avatar" title="User Profile" aria-label="User Profile">CW</div>
      </div>
    </div>
  );
});

export default DashboardHeaderBar;