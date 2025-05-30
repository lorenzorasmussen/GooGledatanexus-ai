
import React, { useState, useEffect } from 'react';
import { InteractionLogEntry } from '../../types';
import InteractionLogItem from './InteractionLogItem';
import LoadingSpinner from '../LoadingSpinner';

const INTERACTION_LOG_STORAGE_KEY = 'dataNexus_interactionLog';

// Icon for Interaction Log View Header
const logViewIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`;

const InteractionLogView: React.FC = () => {
  const [logEntries, setLogEntries] = useState<InteractionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedLog = localStorage.getItem(INTERACTION_LOG_STORAGE_KEY);
      if (storedLog) {
        setLogEntries(JSON.parse(storedLog));
      } else {
        // Pre-populate with the current interaction if the log is empty
        const initialEntry: InteractionLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userPrompt: `User Request (Current):\n- Add a log for our interaction.\n- Double check all requirements from knowledge and see which functionalities are missing.\n- Add chat bubble to interact with ai assistant.\n- Make the dashboard much smaller, like a horizontal one line with smaller icons - for now fill with dummy numbers and icons.\n- Fix "Failed to fetch" errors.`,
            aiResponseSummary: `AI Response (Current):\n- Explained "Failed to fetch" errors (backend server must be running).\n- Added 'Interaction Log' view (this view) using localStorage, with this current exchange as the first entry.\n- Reviewed missing 'DataNexus AI' features and listed them.\n- Confirmed chat bubble implementation is present and relies on backend.\n- Redesigned dashboard to a compact horizontal stats bar with dummy data.\n- Provided XML changes for index.html, App.tsx, src/types.ts, LeftNavigation.tsx, and new components for Interaction Log and Horizontal Stats Bar.`,
            aiResponseDetails: `(See XML output for full code changes. Key new files: src/components/interaction_log/*, src/components/dashboard_stats/*)`
        };
        setLogEntries([initialEntry]);
      }
    } catch (error) {
      console.error("Error loading interaction log from localStorage:", error);
      // Handle error, perhaps by clearing localStorage or starting fresh
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Save to localStorage whenever logEntries change, except during initial load
    if (!isLoading) {
        try {
            localStorage.setItem(INTERACTION_LOG_STORAGE_KEY, JSON.stringify(logEntries));
        } catch (error) {
            console.error("Error saving interaction log to localStorage:", error);
        }
    }
  }, [logEntries, isLoading]);

  if (isLoading) {
    return (
        <div className="view-container interaction-log-view-container">
             <div className="view-header">
                <div className="view-title-group">
                    <span className="view-icon" dangerouslySetInnerHTML={{ __html: logViewIconSVG }} aria-hidden="true" />
                    <h1>Interaction Log</h1>
                </div>
            </div>
            <LoadingSpinner message="Loading interaction log..." />
        </div>
    );
  }

  return (
    <div className="view-container interaction-log-view-container">
      <div className="view-header">
        <div className="view-title-group">
            <span className="view-icon" dangerouslySetInnerHTML={{ __html: logViewIconSVG }} aria-hidden="true" />
            <h1>Interaction Log</h1>
        </div>
        {/* Add actions here if needed, e.g., clear log button */}
      </div>
      {logEntries.length === 0 ? (
        <p className="interaction-log-empty-state">No interactions logged yet.</p>
      ) : (
        <ul className="interaction-log-list">
          {logEntries.slice().reverse().map(entry => ( // Display newest first
            <InteractionLogItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default InteractionLogView;
