
import React from 'react';

interface StatItemProps {
  icon: string; // SVG string
  label: string;
  value: string | number;
  iconColor?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, iconColor }) => {
  return (
    <div className="stat-item" tabIndex={0} role="figure" aria-label={`${label}: ${value}`}>
      <div className="stat-item-icon" dangerouslySetInnerHTML={{ __html: icon }} style={iconColor ? { color: iconColor } : {}} />
      <div className="stat-item-info">
        <span className="stat-item-value">{value}</span>
        <span className="stat-item-label">{label}</span>
      </div>
    </div>
  );
};

export default StatItem;
