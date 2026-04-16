'use client';

import { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAbortController } from '@/lib/hooks/useAbortController';
import type { CheckResponse } from '@/lib/types/checker';
import { normalizeUrl } from '@/lib/utils/normalize-url';

interface UrlFormProps {
  readonly onSuccess: (data: CheckResponse) => void;
  readonly onError: (error: string) => void;
}

export function UrlForm({ onSuccess, onError }: UrlFormProps): React.ReactElement {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clientError, setClientError] = useState<string>('');
  const { getSignal } = useAbortController();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setClientError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawUrl = formData.get('url');
    if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
      setClientError(t.form.errorEmpty);
      setIsLoading(false);
      return;
    }
    const url = normalizeUrl(rawUrl);

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: getSignal(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      const result: CheckResponse = await response.json();
      onSuccess(result);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const message = error instanceof Error ? error.message : 'An error occurred';
      setClientError(message);
      onError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Website Analysis Form">
      <div className="text-left">
        <label htmlFor="website-url" className="block text-frost-700 text-sm font-medium mb-2">
          {t.form.label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
            <Globe className="h-5 w-5 text-frost-400" />
          </div>
          <input
            id="website-url"
            name="url"
            type="text"
            placeholder={t.form.placeholder}
            autoComplete="url"
            required
            className={`w-full bg-frost-50 border rounded-xl pl-11 pr-4 py-4 text-frost-900 placeholder-frost-400 focus:outline-none focus:ring-2 focus:ring-frost-500/20 focus:border-frost-500 transition-all duration-200 ${
              clientError ? 'border-red-300 bg-red-50/30' : 'border-frost-200'
            }`}
            aria-required="true"
            aria-invalid={clientError ? 'true' : 'false'}
            aria-describedby={clientError ? 'url-error' : undefined}
          />
        </div>
        {clientError && (
          <div id="url-error" className="flex items-center gap-2 mt-2 text-red-600 text-sm" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{clientError}</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-frost-500 to-frost-400 hover:from-frost-600 hover:to-frost-500 disabled:from-frost-300 disabled:to-frost-300 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-frost-500/20 hover:shadow-frost-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:shadow-none disabled:scale-100"
        aria-label={isLoading ? t.form.scanning : t.form.submit}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{t.form.scanning}</span>
          </>
        ) : (
          <>
            <span>{t.form.submit}</span>
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
