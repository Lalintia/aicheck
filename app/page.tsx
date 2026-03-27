'use client';

import { useState, useCallback } from 'react';
import { HeroSection } from '@/components/features/checker/hero-section';
import { ResultsView } from '@/components/features/results/results-view';
import { useI18n } from '@/lib/i18n';
import type { CheckResponse } from '@/lib/types/checker';

export default function HomePage(): React.ReactElement {
  const { t } = useI18n();
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback((data: CheckResponse): void => {
    setResult(data);
    setError(null);
  }, []);

  const handleError = useCallback((err: string): void => {
    setError(err);
    setResult(null);
  }, []);

  const handleReset = useCallback((): void => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen relative">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-frost-500 text-white px-4 py-2 rounded-lg z-50 font-medium"
      >
        Skip to main content
      </a>

      <div id="main-content">
        <div role="alert" aria-live="assertive" aria-atomic="true">
          {error && (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-red-700 font-bold text-lg mb-2">{t.error.title}</h1>
                <p id="page-error-message" className="text-frost-700 mb-6">{error}</p>
                <button
                  onClick={handleReset}
                  className="bg-frost-500 hover:bg-frost-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 active:scale-[0.98]"
                  aria-describedby="page-error-message"
                >
                  {t.error.tryAgain}
                </button>
              </div>
            </div>
          )}
        </div>

        {!result && !error && (
          <HeroSection onSuccess={handleSuccess} onError={handleError} />
        )}

        {result && (
          <ResultsView result={result} onReset={handleReset} />
        )}
      </div>
    </main>
  );
}
