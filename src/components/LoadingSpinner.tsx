
import React from 'react';
import { loadingSVG } from '../utils'; // Assuming SVGs are in utils

interface LoadingSpinnerProps {
  message?: string;
  isOverlay?: boolean; // If true, renders as a full overlay
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({ message = 'Loading...', isOverlay = false }) => {
  if (isOverlay) {
    return (
      <div className="initial-loading-overlay">
        <div dangerouslySetInnerHTML={{ __html: loadingSVG }} />
      </div>
    );
  }

  return (
    <div className="loading-state">
      <div dangerouslySetInnerHTML={{ __html: loadingSVG }} />
      {message && <p>{message}</p>}
    </div>
  );
});

export default LoadingSpinner;
