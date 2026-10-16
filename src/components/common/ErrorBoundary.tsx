import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);

    // If chunk load failed (common when new version is deployed to Vercel), auto-reload immediately
    const msg = (error?.message || '').toLowerCase();
    const isChunkError =
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch') ||
      msg.includes('importing a module script') ||
      msg.includes('preload') ||
      msg.includes('networkerror');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('mle_last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 6000) {
        sessionStorage.setItem('mle_last_chunk_reload', now.toString());
        window.location.href = window.location.href.split('?')[0] + '?v=' + now;
        return;
      }
    }
  }

  private handleReset = () => {
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/?v=' + Date.now();
  };

  private handleReload = () => {
    try {
      sessionStorage.removeItem('mle_last_chunk_reload');
    } catch {}
    window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-ivory flex items-center justify-center p-6 text-navy">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-float text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-indigo-light text-indigo flex items-center justify-center mx-auto text-2xl font-black">
              M
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-navy">Page Reload Required</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The application was updated or encountered an unexpected display issue. Please reload to load the latest mill catalog and settings.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-indigo hover:bg-indigo-dark text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                🔄 Refresh Page Now
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                🏠 Return to Storefront Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
