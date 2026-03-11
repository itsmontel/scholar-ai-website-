import React, { Component, ErrorInfo, ReactNode } from 'react';

interface PageErrorBoundaryProps {
  children: ReactNode;
  onGoBack: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Route-level error boundary. Catches errors in the current page only.
 * Shows a compact, inline recovery UI instead of full-page takeover.
 * Use key={currentPage} so navigating away mounts a fresh boundary.
 */
class PageErrorBoundary extends Component<PageErrorBoundaryProps, State> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PageErrorBoundary] Page failed to load:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 p-8 text-center">
            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              This page couldn&apos;t load
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
              Something went wrong. Your data is safe. Try again or go back to your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-5 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
              >
                Reload page
              </button>
              <button
                onClick={() => this.props.onGoBack()}
                className="flex-1 px-5 py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 font-semibold rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;
