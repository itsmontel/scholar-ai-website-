import { Component, ErrorInfo, ReactNode } from 'react';
import { isChunkLoadError } from '../../utils/chunkLoadError';

interface PageErrorBoundaryProps {
  children: ReactNode;
  onGoBack: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  chunkAutoReloadScheduled?: boolean;
}

const CHUNK_AUTO_RETRY_AT_KEY = 'writescholar_chunk_auto_retry_at';
/** Don't loop auto-reloads if the page keeps failing — allow another after a quiet period. */
const CHUNK_AUTO_RETRY_COOLDOWN_MS = 60_000;

/**
 * Route-level error boundary. Catches errors in the current page only.
 * Chunk load failures (common after idle tabs or a new deploy) get one automatic
 * reload before we ask the user to retry manually.
 */
class PageErrorBoundary extends Component<PageErrorBoundaryProps, State> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PageErrorBoundary] Page failed to load:', error, errorInfo);

    if (isChunkLoadError(error)) {
      const prev = parseInt(sessionStorage.getItem(CHUNK_AUTO_RETRY_AT_KEY) || '0', 10);
      const now = Date.now();
      const cooledDown = !prev || now - prev > CHUNK_AUTO_RETRY_COOLDOWN_MS;
      if (cooledDown) {
        sessionStorage.setItem(CHUNK_AUTO_RETRY_AT_KEY, String(now));
        this.setState({ chunkAutoReloadScheduled: true });
        window.setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    }
  }

  private handleHardReload = () => {
    try {
      sessionStorage.removeItem(CHUNK_AUTO_RETRY_AT_KEY);
    } catch (_) {}
    window.location.reload();
  };

  private handleSoftRetry = () => {
    this.setState({ hasError: false, error: undefined, chunkAutoReloadScheduled: false });
  };

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const chunk = err ? isChunkLoadError(err) : false;
      const auto = this.state.chunkAutoReloadScheduled;

      if (auto) {
        return (
          <div className="min-h-[60vh] flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-900">
            <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 p-8 text-center">
              <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" aria-hidden />
              <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100 mb-2">Reconnecting…</h2>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                Refreshing this page to load the latest version. This usually fixes connection hiccups after the tab has been idle.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-stone-50 dark:bg-stone-900">
          <div className="max-w-md w-full bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 p-8 text-center">
            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              {chunk ? 'Could not load this screen' : "This page couldn't load"}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
              {chunk
                ? 'After a while away, your browser sometimes needs to fetch the app again (especially if we shipped an update). Your work is safe — try a refresh.'
                : 'Something went wrong while loading this page. Your data is safe. You can try again or head back to your dashboard.'}
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={this.handleHardReload}
                  className="flex-1 px-5 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors"
                >
                  {chunk ? 'Refresh page' : 'Reload page'}
                </button>
                {!chunk && (
                  <button
                    type="button"
                    onClick={this.handleSoftRetry}
                    className="flex-1 px-5 py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 font-semibold rounded-xl transition-colors"
                  >
                    Try again
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => this.props.onGoBack()}
                className="w-full px-5 py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 font-semibold rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
            {chunk && (
              <p className="mt-4 text-xs text-stone-500 dark:text-stone-400">
                Tip: If this keeps happening, try closing other tabs or checking your connection, then refresh once more.
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;
