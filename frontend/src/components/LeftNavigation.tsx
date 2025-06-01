
import React, { useState } from 'react';
import { AppView, ThemeContext } from '../../App'; // Import AppView type and ThemeContext
import './LeftNavigation.css'; // Import the CSS file

interface LeftNavigationProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  isChatBubbleVisible: boolean;
  onToggleChatBubble: () => void;
}

const chatIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.74 8.74 0 01-4.246-1.122L2.692 17.308a1 1 0 01-1.39-1.445l1.624-2.43A7.954 7.954 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clip-rule="evenodd"></path></svg>`;
const interactionLogIconSVG = `<svg fill="currentColorviewBox="0 0 20 20"><path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>`;
const homeIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>`;
const collapseIconSVG = `<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>`;

const LeftNavigation: React.FC<LeftNavigationProps> = React.memo(({
  activeView,
  onNavigate,
  isChatBubbleVisible,
  onToggleChatBubble
}) => {
  const [isLowMemoryMode, setIsLowMemoryMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = React.useContext(ThemeContext); // Use theme context

  const handleToggleLowMemoryMode = () => {
    setIsLowMemoryMode(prev => !prev);
    console.log("Low Memory Mode Toggled:", !isLowMemoryMode);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  // Nav items for main views
  const mainNavItems: { view: AppView; label: string; svg: string }[] = [
    {
      view: 'home',
      label: 'Home',
      svg: homeIconSVG,
    },
    {
      view: 'dashboard',
      label: 'Dashboard',
      svg: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7H5V5z"></path></svg>`,
    },
    {
      view: 'wiki',
      label: 'Wiki',
      svg: `<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>`,
    },
    {
      view: 'interactionLog',
      label: 'Interaction Log',
      svg: interactionLogIconSVG,
    },
    {
      view: 'departments',
      label: 'Departments',
      svg: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>`,
    },
    {
      view: 'tools',
      label: 'Tools',
      svg: `<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>`,
    },
    {
      view: 'queryInterface',
      label: 'Pinecone Query',
      svg: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>`,
    }]


  const settingsItem: { view: AppView; label: string; svg: string } = {
    view: 'settings',
    label: 'Settings',
    svg: `<svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01-.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>`,
  };


  return (
    <nav className={`left-navigation glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <span className="logo">Data<span className="logo-accent">Nexus</span></span>
        <button onClick={handleToggleCollapse} className="collapse-toggle" aria-expanded={!isCollapsed} aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}>
          <span dangerouslySetInnerHTML={{ __html: collapseIconSVG }} />
        </button>
      </div>
      <ul className="nav-links">
        {mainNavItems.map((item) => (
          <li
            key={item.view}
            className={`nav-item ${activeView === item.view ? 'active' : ''}`}
            data-view={item.view}
          >
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.view);
              }}
              aria-current={activeView === item.view ? 'page' : undefined}
            >
              <span dangerouslySetInnerHTML={{ __html: item.svg }} />
              {item.view !== 'dashboard' && <span className="nav-label">{item.label}</span>}
            </a>
          </li>
        ))} 
         {/* Chat AI Toggle Item */}
        <li
            key="chat-ai-toggle"
            className={`nav-item ${isChatBubbleVisible ? 'chat-bubble-active' : ''}`}
            data-view="chat-ai-toggle"
          >
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onToggleChatBubble();
              }}
              aria-pressed={isChatBubbleVisible} // Indicates toggle state
              title={isChatBubbleVisible ? "Hide Chat AI" : "Show Chat AI"}
            >
              <span dangerouslySetInnerHTML={{ __html: chatIconSVG }} />
              <span className="nav-label">Chat AI</span>
            </a>
          </li>
      </ul>
      <div className="nav-footer">
        <ul>
          <li
            className={`nav-item ${activeView === settingsItem.view ? 'active' : ''}`}
            data-view={settingsItem.view}
          >
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(settingsItem.view);
              }}
              aria-current={activeView === settingsItem.view ? 'page' : undefined}
            >
              <span dangerouslySetInnerHTML={{ __html: settingsItem.svg }} />
              <span className="nav-label">{settingsItem.label}</span>
            </a>
          </li>
          {/* Low Memory Mode Toggle */}
          <li
            className="low-memory-toggle-item"
            onClick={handleToggleLowMemoryMode}
            role="button"
            aria-pressed={isLowMemoryMode}
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleLowMemoryMode();}}
            title={isLowMemoryMode ? "Disable Low Memory Mode" : "Enable Low Memory Mode"}
          >
            
            <div className="toggle-switch-container">
                <label className="toggle-switch" htmlFor="low-memory-toggle-checkbox">
                    <input
                        type="checkbox"
                        id="low-memory-toggle-checkbox"
                        checked={isLowMemoryMode}
                        onChange={handleToggleLowMemoryMode} // Ensures label click works if direct li click fails
                        aria-labelledby="low-memory-label"
                    />
                    <span className="toggle-switch-slider"></span>
                </label>
            </div>
          </li>
          {/* Theme Toggle */} 
          <li
            className="theme-toggle-item"
            onClick={toggleTheme}
            role="button"
            aria-pressed={theme === 'light'}
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTheme();}}
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            
            <div className="toggle-switch-container">
                <label className="toggle-switch" htmlFor="theme-toggle-checkbox">
                    <input
                        type="checkbox"
                        id="theme-toggle-checkbox"
                        checked={theme === 'light'}
                        onChange={toggleTheme}
                        aria-labelledby="theme-label"
                    />
                    <span className="toggle-switch-slider"></span>
                </label>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
});

export default LeftNavigation;