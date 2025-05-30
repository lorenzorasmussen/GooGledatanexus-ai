
import React from 'react';
import { InteractionLogEntry } from '../../types';

interface InteractionLogItemProps {
  entry: InteractionLogEntry;
}

const InteractionLogItem: React.FC<InteractionLogItemProps> = ({ entry }) => {
  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <li className="interaction-log-item">
      <div className="interaction-log-header">
        <span className="log-timestamp">{formatTimestamp(entry.timestamp)}</span>
      </div>
      
      <div>
        <div className="interaction-log-header" style={{borderBottom: 'none', paddingBottom: '0.25rem', marginBottom: '0.25rem'}}>
            <span className="log-role user">User Prompt:</span>
        </div>
        <div className="interaction-log-content" style={{paddingLeft: '1rem', borderLeft: '2px solid var(--color-accent-secondary)', marginBottom: '0.75rem'}}>
            {entry.userPrompt}
        </div>
      </div>

      <div>
        <div className="interaction-log-header" style={{borderBottom: 'none', paddingBottom: '0.25rem', marginBottom: '0.25rem'}}>
             <span className="log-role ai">AI Response:</span>
        </div>
        <div className="interaction-log-content" style={{paddingLeft: '1rem', borderLeft: '2px solid var(--color-accent-primary)'}}>
            <p><strong>Summary:</strong> {entry.aiResponseSummary}</p>
            {entry.aiResponseDetails && (
                <details style={{marginTop: '0.5rem'}}>
                    <summary style={{cursor: 'pointer', color: 'var(--color-text-secondary)'}}>Details</summary>
                    <pre>{entry.aiResponseDetails}</pre>
                </details>
            )}
        </div>
      </div>
    </li>
  );
};

export default InteractionLogItem;
