
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WikiPageDisplayProps } from '../../types';
import { CLOSE_SVG_ICON, EDIT_SVG_ICON } from '../../utils';
import LoadingSpinner from '../LoadingSpinner'; // Use LoadingSpinner component


const WikiPageDisplay: React.FC<WikiPageDisplayProps> = React.memo(({ page, isLoading, onEdit, onClose }) => {
  if (isLoading) {
    return <LoadingSpinner message="Loading page content..." />;
  }

  if (!page) {
    return <div style={{padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)"}}>No page selected or page data not available.</div>;
  }

  return (
    <div className="wiki-page-content-wrapper">
      <div className="wiki-page-display-header">
        <h2>{page.title}</h2>
        <div className="action-buttons">
            <button onClick={() => onEdit(page)} aria-label="Edit Page">
                <span dangerouslySetInnerHTML={{__html: EDIT_SVG_ICON}} /> Edit
            </button>
            <button onClick={onClose} aria-label="Close Page View">
                <span dangerouslySetInnerHTML={{__html: CLOSE_SVG_ICON}} /> Close
            </button>
        </div>
      </div>
      <div className="wiki-page-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.content_md}</ReactMarkdown>
      </div>
    </div>
  );
});

export default WikiPageDisplay;