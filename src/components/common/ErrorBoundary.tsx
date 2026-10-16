import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);

    const msg = (error?.message || '').toLowerCase();
    const isChunkError =
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch') ||
      msg.includes('importing a module script') ||
      msg.includes('preload') ||
      msg.includes('networkerror');

    const isStorageError =
      msg.includes('json') ||
      msg.includes('parse') ||
      msg.includes('syntaxerror') ||
      msg.includes('localstorage');

    // Automatic self-healing: clear corrupt storage cache and reload once seamlessly
    try {
      const autoRecovered = sessionStorage.getItem('mle_auto_recovered_v2');
      if (!autoRecovered && (isChunkError || isStorageError)) {
        sessionStorage.setItem('mle_auto_recovered_v2', 'true');
        this.clearStorageData();
        const cleanUrl = window.location.origin + window.location.pathname + '?recovered=' + Date.now();
        window.location.replace(cleanUrl);
        return;
      }
    } catch {}
  }

  private clearStorageData = () => {
    try {
      const keys = [
        'mle_products',
        'mle_cart',
        'mle_orders',
        'mle_quotations',
        'mle_users',
        'mle_current_user',
        'mle_is_logged_in',
        'mle_mobile_app_config',
        'mle_last_chunk_reload'
      ];
      keys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });
      sessionStorage.clear();
    } catch {
      // ignore
    }
  };

  private handleReload = () => {
    this.clearStorageData();
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  private handleReset = () => {
    this.clearStorageData();
    window.location.href = '/?fresh=' + Date.now();
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
                className="w-full py-3.5 bg-indigo hover:bg-indigo-dark text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
              >
                <span>🔄 Refresh & Auto-Heal Now</span>
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <span>🏠 Return to Storefront Home</span>
              </button>
            </div>

            {this.state.error && (
              <div className="pt-2 border-t border-slate-100 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-medium underline"
                >
                  {this.state.showDetails ? 'Hide technical details' : 'Show technical details'}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 overflow-x-auto whitespace-pre-wrap break-all">
                    {this.state.error.message || String(this.state.error)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
