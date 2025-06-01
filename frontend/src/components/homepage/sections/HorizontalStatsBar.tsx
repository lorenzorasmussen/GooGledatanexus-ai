
import React from 'react';
import StatItem from '../sections/StatItem';

// Dummy SVGs for icons - replace with actual or better placeholders
const usersIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zm5 2a2 2 0 11-4 0 2 2 0 014 0zm-4 7a4 4 0 00-8 0v3h8v-3zm-8-7a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`;
const projectsIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>`;
const tasksIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm8.293-1.707a1 1 0 00-1.414-1.414L10 10.586 8.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`;
const serverLoadIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clip-rule="evenodd"></path></svg>`;


const HorizontalStatsBar: React.FC = () => {
  const stats = [
    { id: 'users', icon: usersIconSVG, label: 'Active Users', value: '1,287', color: 'var(--color-accent-primary)' },
    { id: 'projects', icon: projectsIconSVG, label: 'Total Projects', value: '342', color: '#34D399' /* Tailwind Green 400 */ },
    { id: 'tasks', icon: tasksIconSVG, label: 'Tasks Due', value: '48', color: '#FBBF24' /* Tailwind Amber 400 */ },
    { id: 'load', icon: serverLoadIconSVG, label: 'Server Load', value: '76%', color: '#F87171' /* Tailwind Red 400 */ },
  ];

  return (
    <div className="horizontal-stats-bar-container">
        <div className="horizontal-stats-bar">
        {stats.map(stat => (
            <StatItem
            key={stat.id}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            iconColor={stat.color}
            />
        ))}
        </div>
    </div>
  );
};

export default HorizontalStatsBar;
