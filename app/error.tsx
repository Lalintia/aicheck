'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ErrorBoundaryProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps): React.ReactElement {
  const { t } = useI18n();

  useEffect(() => {
    // Error boundaries are the exception to the no-console rule —
    // these errors must be visible for debugging in all environments
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div role="alert" className="min-h-[400px] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-frost-900 mb-2">{t.error.title}</h1>
        <p id="error-description" className="text-frost-600 mb-4">
          {t.error.message}
        </p>
        {error.digest && (
          <p className="text-xs text-frost-400 font-mono mb-4">Error ID: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          aria-describedby="error-description"
          className="bg-frost-500 hover:bg-frost-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          {t.error.tryAgain}
        </button>
      </div>
    </div>
  );
}
