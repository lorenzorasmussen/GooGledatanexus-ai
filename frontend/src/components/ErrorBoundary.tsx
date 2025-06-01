
import { Component, ErrorInfo, ReactNode } from 'react';
import { errorSVG } from '@/utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-error)' }}>
          <div dangerouslySetInnerHTML={{ __html: errorSVG }} style={{marginBottom: '1rem', display:'inline-block'}} />
          <h2>Something went wrong.</h2>
          <p>We're sorry, an unexpected error occurred. Please try refreshing the page.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
              <summary>Error Details (Development Mode)</summary>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
