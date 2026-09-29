import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-surface p-8">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💥</div>
              <h1 className="text-2xl font-bold text-ink mb-2">Something went wrong</h1>
              <p className="text-sm text-muted">The component crashed. See details below:</p>
            </div>
            
            <div className="bg-critical/10 border-2 border-critical p-6 rounded space-y-4">
              <div>
                <div className="text-xs font-bold text-ink uppercase mb-2">Error Message:</div>
                <div className="text-sm font-mono text-critical bg-surface p-3 rounded">
                  {this.state.error?.toString()}
                </div>
              </div>
              
              {this.state.errorInfo && (
                <div>
                  <div className="text-xs font-bold text-ink uppercase mb-2">Component Stack:</div>
                  <div className="text-xs font-mono text-muted bg-surface p-3 rounded overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full px-6 py-3 bg-accent text-surface font-bold text-sm tracking-wider uppercase hover:bg-ink transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
