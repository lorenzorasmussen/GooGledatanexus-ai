
import React from 'react';

interface PlaceholderViewProps {
  viewName: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ viewName }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>{viewName.charAt(0).toUpperCase() + viewName.slice(1)}</h1>
      <p>This section is currently under construction.</p>
      <p>Content for "{viewName}" will be available soon.</p>
    </div>
  );
};

export default PlaceholderView;
