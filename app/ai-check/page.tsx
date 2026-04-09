'use client';

import { useCallback, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { SiteNav } from '@/components/site-nav';
import { AICheckHero } from './_components/ai-check-hero';
import { AICheckResult, type AICheckResponse } from './_components/ai-check-result';
import { defaultAiCheck } from './_lib/default-ai-check';

export default function AICheckPage(): React.ReactElement {
  const { t } = useI18n();
  const [result, setResult] = useState<AICheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ai = t.aiCheck ?? defaultAiCheck;

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawUrl = formData.get('url');
    if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
      setError(t.form.errorEmpty);
      setIsLoading(false);
      return;
    }

    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      const response = await fetch('/api/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Check failed');
      }

      const data: AICheckResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [t.form.errorEmpty]);

  const handleReset = useCallback(() => {
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
      <SiteNav active="ai-check" />

      <div id="main-content">
        {!result && (
          <AICheckHero
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            ai={ai}
            formT={t.form}
          />
        )}

        {result && (
          <AICheckResult
            data={result}
            onReset={handleReset}
            ai={ai}
          />
        )}
      </div>
    </main>
  );
}
