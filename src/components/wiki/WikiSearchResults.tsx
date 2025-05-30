
import React from 'react';
import { WikiSearchResultsProps } from '../../types';
import { loadingSVG } from '../../utils';


const WikiSearchResults: React.FC<WikiSearchResultsProps> = React.memo(({ results, onSelectPage, isLoading }) => {
  if (isLoading && (!results || results.length === 0)) { // Show loading only if there are no results to display yet
    return <div className="loading-state" style={{position: 'relative'}} dangerouslySetInnerHTML={{ __html: loadingSVG + '<p>Searching...</p>'}}/>;
  }

  if (!results || results.length === 0) {
    return <p className="no-results">No pages found. Try a different search or add a new page.</p>;
  }

  return (
    <ul>
      {results.map((result) => (
        <li key={result.id} onClick={() => onSelectPage(result.id)} role="button" tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectPage(result.id);}} // Added spacebar for accessibility
        >
          <span className="result-title">{result.title || 'Untitled Page'}</span>
          {typeof result.score !== 'undefined' && (
            <span className="result-score">Score: {result.score.toFixed(2)}</span>
          )}
        </li>
      ))}
    </ul>
  );
});

export default WikiSearchResults;
