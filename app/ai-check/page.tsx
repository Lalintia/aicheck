'use client';

import { useState, useCallback, useMemo } from 'react';
import { AlertCircle, ArrowRight, Loader2, Globe, Brain, CheckCircle, XCircle, AlertTriangle, Eye, Link2, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { SiteNav } from '@/components/site-nav';
import type { CheckResult } from '@/lib/types/checker';

interface AICheckResponse {
  readonly url: string;
  readonly result: CheckResult;
}

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
      <SiteNav active="ai-check" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-frost-500 text-white px-4 py-2 rounded-lg z-50 font-medium"
      >
        Skip to main content
      </a>

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

// ─── Default translations fallback ──────────────────────────
const defaultAiCheck = {
  badge: 'AI Visibility',
  title: 'Does AI',
  titleHighlight: 'know your brand?',
  subtitle: 'Ask GPT directly whether it recognizes your website, knows your URL, and has accurate information about your business.',
  submit: 'Ask AI',
  scanning: 'Asking AI...',
  resultTitle: 'AI Visibility Result',
  knows: 'AI Knows',
  doesNotKnow: 'AI Does Not Know',
  accuracy: 'Accuracy',
  accuracyLevels: {
    accurate: 'Accurate',
    partial: 'Partial',
    inaccurate: 'Inaccurate',
    unknown: 'Unknown',
  },
  urlKnown: 'URL Known',
  urlNotKnown: 'URL Not Known',
  summary: 'Summary',
  details: 'Details',
  model: 'Model',
  analyzeAnother: 'Check Another Website',
  skipped: 'Check was skipped',
};

// ─── Hero Section ───────────────────────────────────────────
interface AICheckHeroProps {
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly ai: typeof defaultAiCheck;
  readonly formT: { label: string; placeholder: string; errorEmpty: string };
}

function AICheckHero({ onSubmit, isLoading, error, ai, formT }: AICheckHeroProps): React.ReactElement {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 overflow-hidden" aria-label="AI Visibility Check">
      {/* Neural network background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full neural-glow" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full neural-glow-secondary" />
        <div className="absolute top-1/2 left-1/6 w-[200px] h-[200px] rounded-full bg-gradient-radial from-violet-200/15 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full ai-badge-glow text-sm font-medium mb-8">
          <Brain className="w-4 h-4 text-violet-500" aria-hidden="true" />
          <span className="bg-gradient-to-r from-violet-600 to-frost-500 bg-clip-text text-transparent font-semibold">
            {ai.badge}
          </span>
        </div>

        {/* Title */}
        <h1 className="animate-fade-up stagger-1 text-4xl sm:text-5xl md:text-6xl font-black text-frost-900 mb-6 tracking-tight leading-[1.1]">
          {ai.title}{' '}
          <span className="bg-gradient-to-r from-violet-500 via-frost-500 to-violet-400 bg-clip-text text-transparent">
            {ai.titleHighlight}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up stagger-2 text-lg sm:text-xl text-frost-700/70 mb-12 max-w-xl mx-auto leading-relaxed">
          {ai.subtitle}
        </p>

        {/* Form */}
        <div className="animate-fade-up stagger-3 glass-card rounded-2xl p-6 sm:p-8 ai-form-glow transition-transform duration-300 hover:scale-[1.01]">
          <form onSubmit={onSubmit} className="space-y-4" aria-label="AI Visibility Check Form">
            <div className="text-left">
              <label htmlFor="ai-check-url" className="block text-frost-700 text-sm font-medium mb-2">
                {formT.label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
                  <Globe className="h-5 w-5 text-frost-400" />
                </div>
                <input
                  id="ai-check-url"
                  name="url"
                  type="text"
                  placeholder={formT.placeholder}
                  autoComplete="url"
                  required
                  className={`w-full bg-frost-50 border rounded-xl pl-11 pr-4 py-4 text-frost-900 placeholder-frost-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 ${
                    error ? 'border-red-300 bg-red-50/30' : 'border-frost-200'
                  }`}
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-500 to-frost-500 hover:from-violet-600 hover:to-frost-600 disabled:from-frost-300 disabled:to-frost-300 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:shadow-none disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>{ai.scanning}</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" aria-hidden="true" />
                  <span>{ai.submit}</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Trust indicators */}
        <div className="animate-fade-up stagger-4 mt-10 flex flex-wrap items-center justify-center gap-8 text-frost-500 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" aria-hidden="true" />
            <span>GPT-4.1 nano</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-frost-400" aria-hidden="true" />
            <span>Real AI Check</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-frost-400" aria-hidden="true" />
            <span>Instant Result</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Result View ────────────────────────────────────────────
interface AICheckResultProps {
  readonly data: AICheckResponse;
  readonly onReset: () => void;
  readonly ai: typeof defaultAiCheck;
}

function AICheckResult({ data, onReset, ai }: AICheckResultProps): React.ReactElement {
  const { result } = data;
  const d = result.data;

  const knows = d.knows === true;
  const accuracy = (d.accuracy as string) ?? 'unknown';
  const hasUrl = d.hasUrl === true;
  const summary = (d.summary as string) ?? '';
  const details = (d.details as string) ?? '';
  const model = (d.model as string) ?? 'gpt-4.1-nano';
  const skipped = d.skipped === true;

  const score = result.score;

  const scoreColor = useMemo(() => {
    if (score >= 80) { return 'text-emerald-500'; }
    if (score >= 50) { return 'text-amber-500'; }
    return 'text-rose-500';
  }, [score]);

  const ringColor = useMemo(() => {
    if (score >= 80) { return 'stroke-emerald-500'; }
    if (score >= 50) { return 'stroke-amber-500'; }
    return 'stroke-rose-500';
  }, [score]);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  if (skipped) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-frost-900 mb-2">{ai.skipped}</h2>
          <p className="text-frost-600 mb-6">{result.details}</p>
          <button onClick={onReset} className="bg-frost-500 hover:bg-frost-600 text-white px-6 py-3 rounded-xl font-medium transition-all">
            {ai.analyzeAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Header */}
      <div className="animate-fade-up text-center mb-8">
        <p className="text-frost-500 text-sm mb-1">{ai.resultTitle}</p>
        <p className="text-frost-400 text-xs font-mono">{data.url}</p>
      </div>

      {/* Score Ring */}
      <div className="animate-fade-up stagger-1 flex justify-center mb-10">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-frost-200/50" />
            <circle
              cx="60" cy="60" r="54" fill="none" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`score-ring ${ringColor}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black font-mono ${scoreColor}`}>{score}</span>
            <span className="text-frost-400 text-xs">/100</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="animate-fade-up stagger-2 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Knows */}
        <div className={`glass-card rounded-2xl p-5 text-center ${knows ? 'ring-2 ring-emerald-200' : 'ring-2 ring-rose-200'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${knows ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            {knows ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
          </div>
          <p className={`text-sm font-bold ${knows ? 'text-emerald-600' : 'text-rose-600'}`}>
            {knows ? ai.knows : ai.doesNotKnow}
          </p>
        </div>

        {/* Accuracy */}
        <div className="glass-card rounded-2xl p-5 text-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${
            accuracy === 'accurate' ? 'bg-emerald-50' :
            accuracy === 'partial' ? 'bg-amber-50' : 'bg-frost-50'
          }`}>
            <Eye className={`w-5 h-5 ${
              accuracy === 'accurate' ? 'text-emerald-500' :
              accuracy === 'partial' ? 'text-amber-500' : 'text-frost-400'
            }`} />
          </div>
          <p className="text-xs text-frost-500 mb-1">{ai.accuracy}</p>
          <p className={`text-sm font-bold ${
            accuracy === 'accurate' ? 'text-emerald-600' :
            accuracy === 'partial' ? 'text-amber-600' :
            accuracy === 'inaccurate' ? 'text-rose-600' : 'text-frost-500'
          }`}>
            {ai.accuracyLevels[accuracy as keyof typeof ai.accuracyLevels] ?? accuracy}
          </p>
        </div>

        {/* URL Known */}
        <div className={`glass-card rounded-2xl p-5 text-center ${hasUrl ? 'ring-2 ring-emerald-200' : 'ring-2 ring-amber-200'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${hasUrl ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <Link2 className={`w-5 h-5 ${hasUrl ? 'text-emerald-500' : 'text-amber-500'}`} />
          </div>
          <p className={`text-sm font-bold ${hasUrl ? 'text-emerald-600' : 'text-amber-600'}`}>
            {hasUrl ? ai.urlKnown : ai.urlNotKnown}
          </p>
        </div>
      </div>

      {/* Summary & Details */}
      {summary && (
        <div className="animate-fade-up stagger-3 glass-card rounded-2xl p-6 mb-4">
          <h3 className="text-sm font-semibold text-frost-700 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" aria-hidden="true" />
            {ai.summary}
          </h3>
          <p className="text-frost-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {details && (
        <div className="animate-fade-up stagger-4 glass-card rounded-2xl p-6 mb-4">
          <h3 className="text-sm font-semibold text-frost-700 mb-2">{ai.details}</h3>
          <p className="text-frost-600 leading-relaxed">{details}</p>
        </div>
      )}

      {/* Model badge */}
      <div className="animate-fade-up stagger-5 text-center mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-frost-100 text-frost-500 text-xs font-mono">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          {ai.model}: {model}
        </span>
      </div>

      {/* Reset */}
      <div className="animate-fade-up stagger-6 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-frost-500 hover:bg-frost-600 text-white font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {ai.analyzeAnother}
        </button>
      </div>
    </div>
  );
}
