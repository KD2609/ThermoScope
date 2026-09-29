import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ThermoScope ErrorBoundary caught an uncaught render error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-geo-900">
              {this.props.fallbackTitle || 'Interface Render Notice'}
            </h2>
            <p className="text-sm text-geo-600 max-w-md mx-auto">
              A temporary telemetry rendering issue occurred. No operational data was lost.
            </p>
            {this.state.error?.message && (
              <p className="text-xs font-mono text-geo-500 bg-geo-100 p-2.5 rounded-lg max-w-lg mx-auto overflow-x-auto text-left">
                {this.state.error.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-geo-300 bg-white hover:bg-geo-50 text-geo-700 text-xs font-bold transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
