import * as React from 'react';
import LeftNavigation from './src/components/LeftNavigation';
import DashboardHeaderSection from './src/components/homepage/sections/DashboardHeaderSection';
import FileProtocolWarning from './src/components/FileProtocolWarning';
import LoadingSpinner from './src/components/LoadingSpinner'; // For Suspense fallback
import ErrorBoundary from './src/components/ErrorBoundary'; // For robustness
import './App.css'; //  Import the global CSS file


// Lazy load views & components
const HorizontalStatsBar = React.lazy(() => import('./src/components/homepage/sections/HorizontalStatsBar'));
const WikiViewContainer = React.lazy(() => import('./src/components/wiki/WikiViewContainer'));
const InteractionLogView = React.lazy(() => import('./src/components/interaction_log/InteractionLogView'));
const PlaceholderView = React.lazy(() => import('./src/components/PlaceholderView'));
const ChatBubble = React.lazy(() => import('./src/components/chat/ChatBubble'));
const DashboardLayout = React.lazy(() => import('./src/components/homepage/layout/DashboardLayout'));
const StatsOverviewWidget = React.lazy(() => import('./src/components/homepage/widgets/StatsOverviewWidget'));

const QueryInterface = React.lazy(() => import('./src/components/QueryInterface'));

export type AppView = 'dashboard' | 'wiki' | 'departments' | 'tools' | 'settings' | 'interactionLog' | 'home' | 'queryInterface';

export const ThemeContext = React.createContext({
  theme: 'dark' as 'dark',
  toggleTheme: () => {},
});

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = React.useState(true);
  const [showFileProtocolWarning, setShowFileProtocolWarning] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<AppView>('dashboard');
  const [isChatBubbleVisible, setIsChatBubbleVisible] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark'>('dark'); // Always dark theme

  const toggleTheme = React.useCallback(() => {
    // No-op as theme is always dark
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (window.location.protocol === 'file:') {
      setShowFileProtocolWarning(true);
      setIsAppLoading(false);
    } else {
      const timer = setTimeout(() => {
        setIsAppLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNavigate = React.useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const handleToggleChatBubble = React.useCallback(() => {
    setIsChatBubbleVisible(prev => !prev);
  }, []);

  if (showFileProtocolWarning) {
    return <FileProtocolWarning />;
  }

  if (isAppLoading) {
    return <LoadingSpinner isOverlay={true} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <DashboardLayout />;
      case 'dashboard':
        return (
          <>
            <DashboardHeaderSection />
            <React.Suspense fallback={<LoadingSpinner message="Loading dashboard stats..." />}>
              <HorizontalStatsBar />
            </React.Suspense>
            <React.Suspense fallback={<LoadingSpinner message="Loading dashboard widgets..." />}>
              <StatsOverviewWidget />
            </React.Suspense>
          </>
        );
      case 'wiki':
        return <WikiViewContainer />;
      case 'interactionLog':
        return <InteractionLogView />;
      case 'departments':
      case 'tools':
      case 'settings':
        return <PlaceholderView viewName={currentView} />;
      case 'queryInterface':
        return <QueryInterface />;
      default:
        return <PlaceholderView viewName="Unknown" />;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="app-container">
        <LeftNavigation
          activeView={currentView}
          onNavigate={handleNavigate}
          isChatBubbleVisible={isChatBubbleVisible}
          onToggleChatBubble={handleToggleChatBubble}
        />
        <main className="dashboard-area"> {/* This classname might need to be more generic if area used for non-dashboards */}
          <ErrorBoundary>
            <React.Suspense fallback={<LoadingSpinner message={`Loading ${currentView}...`} />}>
              {renderView()}
            </React.Suspense>
          </ErrorBoundary>
        </main>
        <React.Suspense fallback={<div style={{position: 'fixed', bottom: '20px', right: '20px'}}><LoadingSpinner /></div>}>
          {isChatBubbleVisible && <ChatBubble />}
        </React.Suspense>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;