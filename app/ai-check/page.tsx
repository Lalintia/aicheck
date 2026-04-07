'use client';

import { useState, useCallback, useMemo, useId, memo } from 'react';
import { AlertCircle, ArrowRight, Loader2, Globe, Brain, CheckCircle, XCircle, AlertTriangle, Eye, Link2, Sparkles, Search, Package, Layers, Network, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { SiteNav } from '@/components/site-nav';
import type { CheckResult } from '@/lib/types/checker';

interface AICheckResponse {
  readonly url: string;
  readonly result: CheckResult;
}

interface GooglePresenceData {
  readonly totalResults: number;
  readonly topPosition: number | null;
}

interface KnowledgeGraphData {
  readonly hasKnowledgeGraph: boolean;
  readonly hasAnswerBox: boolean;
  readonly descriptionSource: string | null;
  readonly title: string | null;
}

function parseGooglePresence(value: unknown): GooglePresenceData | undefined {
  if (!value || typeof value !== 'object') { return undefined; }
  const v = value as Record<string, unknown>;
  if (typeof v.totalResults !== 'number') { return undefined; }
  const pos = v.topPosition;
  if (pos !== null && typeof pos !== 'number') { return undefined; }
  return { totalResults: v.totalResults, topPosition: pos };
}

function parseKnowledgeGraph(value: unknown): KnowledgeGraphData | undefined {
  if (!value || typeof value !== 'object') { return undefined; }
  const v = value as Record<string, unknown>;
  if (typeof v.hasKnowledgeGraph !== 'boolean') { return undefined; }
  if (typeof v.hasAnswerBox !== 'boolean') { return undefined; }
  return {
    hasKnowledgeGraph: v.hasKnowledgeGraph,
    hasAnswerBox: v.hasAnswerBox,
    descriptionSource: typeof v.descriptionSource === 'string' ? v.descriptionSource : null,
    title: typeof v.title === 'string' ? v.title : null,
  };
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

// ─── Default translations fallback ──────────────────────────
const defaultAiCheck = {
  badge: 'AI Visibility',
  title: 'Does AI',
  titleHighlight: 'know your brand?',
  subtitle: 'Ask GPT directly whether it recognizes your website, knows your URL, and has accurate information about your business.',
  submit: 'Ask AI',
  scanning: 'Asking AI...',
  resultTitle: 'AI Visibility Result',
  knows: 'AI Recognition',
  doesNotKnow: 'AI Unknown',
  accuracy: 'Accuracy',
  accuracyLevels: {
    accurate: 'Accurate',
    partial: 'Partial',
    inaccurate: 'Inaccurate',
    unknown: 'Unknown',
  },
  urlKnown: 'URL Known',
  urlNotKnown: 'URL Not Known',
  knowledgeDepth: 'Knowledge Depth',
  depthLevels: {
    deep: 'Deep',
    moderate: 'Moderate',
    shallow: 'Shallow',
    none: 'None',
  },
  productsKnown: 'Products Known',
  productsNotKnown: 'Products Unknown',
  googlePresence: 'Google Presence',
  googleTop3: 'Top 3',
  googleTop5: 'Top 5',
  googleTop10: 'Top 10',
  googleLow: 'Low',
  googleNone: 'Not Found',
  knowledgeGraph: 'Knowledge Graph',
  knowledgeGraphFull: 'Full Entity',
  knowledgeGraphPartial: 'Knowledge Panel',
  knowledgeGraphAnswerOnly: 'Answer Only',
  knowledgeGraphNone: 'Not Indexed',
  scoreBreakdown: 'Score Breakdown',
  scoringCriteria: 'Scoring Criteria',
  criteriaItems: [
    { label: 'AI Recognition', max: '20', desc: 'Does the AI recognize this website?', why: '', howToImprove: '' },
    { label: 'Accuracy', max: '15', desc: 'Is the AI\'s knowledge correct?', why: '', howToImprove: '' },
    { label: 'URL Known', max: '10', desc: 'Can the AI provide the correct URL?', why: '', howToImprove: '' },
    { label: 'Knowledge Depth', max: '15', desc: 'How deep is the AI\'s knowledge?', why: '', howToImprove: '' },
    { label: 'Products/Services', max: '15', desc: 'Can AI name specific products?', why: '', howToImprove: '' },
    { label: 'Google Presence', max: '10', desc: 'SEO ranking in Google search', why: '', howToImprove: '' },
    { label: 'Knowledge Graph', max: '15', desc: 'Is the brand in Google Knowledge Graph?', why: '', howToImprove: '' },
  ] as ReadonlyArray<{ readonly label: string; readonly max: string; readonly desc: string; readonly why: string; readonly howToImprove: string }>,
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
                  aria-describedby={error ? 'ai-check-url-error' : undefined}
                />
              </div>
              {error && (
                <div id="ai-check-url-error" className="flex items-center gap-2 mt-2 text-red-600 text-sm" role="alert">
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
  const accuracy = typeof d.accuracy === 'string' ? d.accuracy : 'unknown';
  const hasUrl = d.hasUrl === true;
  const knowledgeDepth = typeof d.knowledgeDepth === 'string' ? d.knowledgeDepth : 'none';
  const productsKnown = d.productsKnown === true;
  const googlePresence = parseGooglePresence(d.googlePresence);
  const knowledgeGraphData = parseKnowledgeGraph(d.knowledgeGraph);
  const breakdown = (d.breakdown && typeof d.breakdown === 'object' && !Array.isArray(d.breakdown))
    ? d.breakdown as Record<string, number>
    : undefined;
  const summary = typeof d.summary === 'string' ? d.summary : '';
  const details = typeof d.details === 'string' ? d.details : '';
  const model = typeof d.model === 'string' ? d.model : 'gpt-4.1-nano';
  const skipped = d.skipped === true;

  const score = result.score;

  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500';
  const ringColor = score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-rose-500';

  const googleLabel = useMemo(() => {
    if (!googlePresence) { return ai.googleNone; }
    const pos = googlePresence.topPosition;
    if (pos !== null && pos <= 3) { return ai.googleTop3; }
    if (pos !== null && pos <= 5) { return ai.googleTop5; }
    if (pos !== null && pos <= 10) { return ai.googleTop10; }
    if (googlePresence.totalResults > 0) { return ai.googleLow; }
    return ai.googleNone;
  }, [googlePresence, ai.googleTop3, ai.googleTop5, ai.googleTop10, ai.googleLow, ai.googleNone]);

  const kgLabel = useMemo(() => {
    if (!knowledgeGraphData) { return ai.knowledgeGraphNone; }
    if (knowledgeGraphData.hasKnowledgeGraph && knowledgeGraphData.hasAnswerBox) { return ai.knowledgeGraphFull; }
    if (knowledgeGraphData.hasKnowledgeGraph) { return ai.knowledgeGraphPartial; }
    if (knowledgeGraphData.hasAnswerBox) { return ai.knowledgeGraphAnswerOnly; }
    return ai.knowledgeGraphNone;
  }, [knowledgeGraphData, ai.knowledgeGraphFull, ai.knowledgeGraphPartial, ai.knowledgeGraphAnswerOnly, ai.knowledgeGraphNone]);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  if (skipped) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-frost-900 mb-2">{ai.skipped}</h2>
          <p className="text-frost-600 mb-6">{result.details}</p>
          <button type="button" onClick={onReset} className="bg-frost-500 hover:bg-frost-600 text-white px-6 py-3 rounded-xl font-medium transition-all">
            {ai.analyzeAnother}
          </button>
        </div>
      </div>
    );
  }

  const breakdownItems = [
    { label: ai.knows, score: breakdown?.recognition ?? 0, max: 20 },
    { label: ai.accuracy, score: breakdown?.accuracy ?? 0, max: 15 },
    { label: ai.urlKnown, score: breakdown?.urlKnown ?? 0, max: 10 },
    { label: ai.knowledgeDepth, score: breakdown?.depth ?? 0, max: 15 },
    { label: ai.productsKnown, score: breakdown?.products ?? 0, max: 15 },
    { label: ai.googlePresence, score: breakdown?.googlePresence ?? 0, max: 10 },
    { label: ai.knowledgeGraph, score: breakdown?.knowledgeGraph ?? 0, max: 15 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Header */}
      <div className="animate-fade-up text-center mb-8">
        <p className="text-frost-500 text-sm mb-1">{ai.resultTitle}</p>
        <p className="text-frost-400 text-xs font-mono">{data.url}</p>
      </div>

      {/* Score Ring */}
      <div className="animate-fade-up stagger-1 flex justify-center mb-10">
        <div className="relative w-40 h-40" role="img" aria-label={`AI Visibility score: ${score} out of 100`}>
          <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
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

      {/* 7 Dimension Cards — responsive grid */}
      <div className="animate-fade-up stagger-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {/* 1. Knows */}
        <DimensionCard
          icon={knows ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          label={knows ? ai.knows : ai.doesNotKnow}
          value={`${breakdown?.recognition ?? 0}/20`}
          positive={knows}
        />
        {/* 2. Accuracy */}
        <DimensionCard
          icon={<Eye className="w-4 h-4" />}
          label={ai.accuracy}
          value={ai.accuracyLevels[accuracy as keyof typeof ai.accuracyLevels] ?? accuracy}
          positive={accuracy === 'accurate'}
          neutral={accuracy === 'partial'}
        />
        {/* 3. URL */}
        <DimensionCard
          icon={<Link2 className="w-4 h-4" />}
          label={hasUrl ? ai.urlKnown : ai.urlNotKnown}
          value={`${breakdown?.urlKnown ?? 0}/10`}
          positive={hasUrl}
        />
        {/* 4. Depth */}
        <DimensionCard
          icon={<Layers className="w-4 h-4" />}
          label={ai.knowledgeDepth}
          value={ai.depthLevels[knowledgeDepth as keyof typeof ai.depthLevels] ?? knowledgeDepth}
          positive={knowledgeDepth === 'deep'}
          neutral={knowledgeDepth === 'moderate'}
        />
        {/* 5. Products */}
        <DimensionCard
          icon={<Package className="w-4 h-4" />}
          label={productsKnown ? ai.productsKnown : ai.productsNotKnown}
          value={`${breakdown?.products ?? 0}/15`}
          positive={productsKnown}
        />
        {/* 6. Google */}
        <DimensionCard
          icon={<Search className="w-4 h-4" />}
          label={ai.googlePresence}
          value={googleLabel}
          positive={googlePresence?.topPosition !== null && (googlePresence?.topPosition ?? 99) <= 5}
          neutral={googlePresence?.topPosition !== null && (googlePresence?.topPosition ?? 99) <= 10}
        />
        {/* 7. Knowledge Graph */}
        <DimensionCard
          icon={<Network className="w-4 h-4" />}
          label={ai.knowledgeGraph}
          value={kgLabel}
          positive={knowledgeGraphData?.hasKnowledgeGraph === true}
          neutral={knowledgeGraphData?.hasAnswerBox === true && !knowledgeGraphData?.hasKnowledgeGraph}
        />
      </div>

      {/* Score Breakdown Bar */}
      <div className="animate-fade-up stagger-3 glass-card rounded-2xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-frost-700 mb-4">{ai.scoreBreakdown}</h3>
        <div className="space-y-3">
          {breakdownItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-frost-600 w-28 shrink-0 truncate">{item.label}</span>
              <div className="flex-1 h-2 bg-frost-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.score >= item.max * 0.8 ? 'bg-emerald-500' :
                    item.score >= item.max * 0.4 ? 'bg-amber-500' : 'bg-rose-400'
                  }`}
                  style={{ width: `${(item.score / item.max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-frost-500 w-10 text-right">{item.score}/{item.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary & Details */}
      {summary && (
        <div className="animate-fade-up stagger-4 glass-card rounded-2xl p-6 mb-4">
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

      {/* Scoring Criteria — expandable cards with Why + How to improve */}
      <div className="animate-fade-up stagger-5 glass-card rounded-2xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-frost-700 mb-3">{ai.scoringCriteria}</h3>
        <div className="space-y-2">
          {ai.criteriaItems.map((item) => (
            <CriteriaCard key={item.label} item={item} />
          ))}
        </div>
      </div>

      {/* Model badge */}
      <div className="animate-fade-up stagger-6 text-center mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-frost-100 text-frost-500 text-xs font-mono">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          {ai.model}: {model}
        </span>
      </div>

      {/* Reset */}
      <div className="animate-fade-up stagger-6 text-center">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-frost-500 hover:bg-frost-600 text-white font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {ai.analyzeAnother}
        </button>
      </div>
    </div>
  );
}

// ─── Dimension Card ──────────────────────────────────────────
interface DimensionCardProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly positive?: boolean;
  readonly neutral?: boolean;
}

// ─── Criteria Card (expandable) ──────────────────────────────
interface CriteriaItem {
  readonly label: string;
  readonly max: string;
  readonly desc: string;
  readonly why: string;
  readonly howToImprove: string;
}

interface CriteriaCardProps {
  readonly item: CriteriaItem;
}

function CriteriaCardImpl({ item }: CriteriaCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const hasDetails = item.why.length > 0 || item.howToImprove.length > 0;

  const cardContent = (
    <>
      <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
        <span className="text-xs font-bold text-violet-600">{item.max}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-frost-700">{item.label}</p>
        <p className="text-[11px] text-frost-500 leading-snug">{item.desc}</p>
      </div>
    </>
  );

  // Static card for items without details — stays in tab flow as a div
  if (!hasDetails) {
    return (
      <div className="bg-frost-50/50 rounded-xl w-full flex items-center gap-3 p-3">
        {cardContent}
      </div>
    );
  }

  return (
    <div className="bg-frost-50/50 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-frost-50 transition-colors"
      >
        {cardContent}
        <div className="shrink-0 text-frost-400" aria-hidden="true">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-label={item.label}
          className="px-3 pb-3 pt-0 space-y-3 border-t border-frost-100/50"
        >
          {item.why && (
            <div className="pt-3">
              <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">Why it matters</p>
              <p className="text-[11px] text-frost-600 leading-relaxed">{item.why}</p>
            </div>
          )}
          {item.howToImprove && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">How to improve</p>
              <p className="text-[11px] text-frost-600 leading-relaxed">{item.howToImprove}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CriteriaCard = memo(CriteriaCardImpl);

function DimensionCard({ icon, label, value, positive, neutral }: DimensionCardProps): React.ReactElement {
  const borderColor = positive ? 'ring-emerald-200' : neutral ? 'ring-amber-200' : 'ring-frost-200';
  const iconBg = positive ? 'bg-emerald-50 text-emerald-500' : neutral ? 'bg-amber-50 text-amber-500' : 'bg-frost-50 text-frost-400';
  const valueColor = positive ? 'text-emerald-600' : neutral ? 'text-amber-600' : 'text-frost-500';

  return (
    <div className={`glass-card rounded-xl p-4 text-center ring-1 ${borderColor}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${iconBg}`}>
        {icon}
      </div>
      <p className="text-[11px] text-frost-500 mb-0.5 truncate">{label}</p>
      <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
