// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    // @ts-ignore
    const { hasError, error } = this.state;
    // @ts-ignore
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-error/10 border-dashed">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-headline text-on-surface">Something went wrong</h2>
            <p className="text-secondary text-sm leading-relaxed">
              An unexpected error occurred in this module. PRISM was unable to safely recover the UI state.
            </p>
            <div className="flex gap-4 justify-center pt-2">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-md"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-6 py-2 bg-background border border-outline-variant/20 rounded-lg text-sm font-bold"
              >
                <Home className="w-4 h-4" /> Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-surface-container-lowest rounded-xl text-[10px] text-error text-left overflow-auto max-h-40 border border-error/5" style={{ whiteSpace: 'pre-wrap' }}>
                {error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    // @ts-ignore
    return children;
  }
}
