
import * as React from 'react';
import LeftNavigation from './src/components/LeftNavigation';
import DashboardHeaderBar from './src/components/DashboardHeaderBar';
// import WidgetsGrid from './src/components/WidgetsGrid'; // No longer used for dashboard
// import WeatherWidget from './src/components/WeatherWidget'; // No longer used for dashboard
// import CryptoWidget from './src/components/CryptoWidget'; // No longer used for dashboard
// import DashboardOverviewWidgets from './src/components/DashboardOverviewWidgets'; // No longer used for dashboard
import FileProtocolWarning from './src/components/FileProtocolWarning';
import LoadingSpinner from './src/components/LoadingSpinner'; // For Suspense fallback
import ErrorBoundary from './src/components/ErrorBoundary'; // For robustness

// Lazy load views & components
const HorizontalStatsBar = React.lazy(() => import('./src/components/dashboard_stats/HorizontalStatsBar'));
const WikiViewContainer = React.lazy(() => import('./src/components/wiki/WikiViewContainer'));
const InteractionLogView = React.lazy(() => import('./src/components/interaction_log/InteractionLogView'));
const PlaceholderView = React.lazy(() => import('./src/components/PlaceholderView'));
const ChatBubble = React.lazy(() => import('./src/components/chat/ChatBubble'));


export type AppView = 'dashboard' | 'wiki' | 'departments' | 'tools' | 'settings' | 'interactionLog';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = React.useState(true);
  const [showFileProtocolWarning, setShowFileProtocolWarning] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<AppView>('dashboard'); 
  const [isChatBubbleVisible, setIsChatBubbleVisible] = React.useState(false);

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
      case 'dashboard':
        return (
          <>
            <DashboardHeaderBar />
            <React.Suspense fallback={<LoadingSpinner message="Loading dashboard stats..." />}>
              <HorizontalStatsBar />
            </React.Suspense>
            {/* Old widget grid removed. 
                If you want to keep specific widgets on dashboard, they can be added here.
                For example, specific charts or data summaries.
            */}
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
      default:
        return <PlaceholderView viewName="Unknown" />;
    }
  };

  return (
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
  );
};

export default App;