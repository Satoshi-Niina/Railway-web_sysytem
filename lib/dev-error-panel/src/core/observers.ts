import { errorStore } from './store';

/**
 * グローバルエラーをキャッチする設定
 */
export function setupObservers() {
  if (typeof window === 'undefined') return;

  // 1. Runtime Errors
  window.addEventListener('error', (event) => {
    errorStore.addError({
      type: 'runtime',
      message: event.message,
      stack: event.error?.stack,
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // 2. Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorStore.addError({
      type: 'promise',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });
  });

  // 3. Console Error Hook
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // 元のconsole.errorを呼ぶ（挙動を壊さない）
    originalConsoleError.apply(console, args);

    const message = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
      .join(' ');

    errorStore.addError({
      type: 'console',
      message,
      metadata: { args },
    });
  };

  // 4. API Error Hook (Optional shim for fetch)
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      if (!response.ok) {
        errorStore.addError({
          type: 'api',
          message: `Fetch failed: ${response.status} ${response.statusText}`,
          metadata: { url: args[0], status: response.status },
        });
      }
      return response;
    } catch (error: any) {
      errorStore.addError({
        type: 'api',
        message: error.message || 'Network Error',
        stack: error.stack,
        metadata: { url: args[0] },
      });
      throw error;
    }
  };
}
