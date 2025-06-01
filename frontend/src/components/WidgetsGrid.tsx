import React from 'react';

interface WidgetsGridProps {
  children: React.ReactNode;
}

const WidgetsGrid: React.FC<WidgetsGridProps> = ({ children }) => {
  return (
    <div className="widgets-grid">
      {children}
    </div>
  );
};

export default WidgetsGrid;
