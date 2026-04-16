'use client';

import { useMemo } from 'react';
import { CheckCircle, Eye, Layers, Link2, Network, Package, Search, Sparkles, XCircle } from 'lucide-react';
import type { CheckResult } from '@/lib/types/checker';
import { parseBreakdown, parseGooglePresence, parseKnowledgeGraph } from '../_lib/parsers';
import type { AiCheckStrings } from '../_lib/default-ai-check';
import { DimensionCard } from './dimension-card';
import { CriteriaCard } from './criteria-card';
import { AiCheckSkipped } from './AiCheckSkipped';
import { ScoreBreakdown } from './ScoreBreakdown';
import type { BreakdownItem } from './ScoreBreakdown';
import { AiCheckSummary } from './AiCheckSummary';

// SVG circle radius for the score ring — kept in sync with the `r="..."` attr on the
// <circle> element below. Changing this requires updating both places.
const SCORE_RING_RADIUS = 54;

// Module-level icon constants — shared references keep DimensionCard memo effective
const CHECK_ICON = <CheckCircle className="w-4 h-4" />;
const X_ICON = <XCircle className="w-4 h-4" />;
const EYE_ICON = <Eye className="w-4 h-4" />;
const LINK_ICON = <Link2 className="w-4 h-4" />;
const LAYERS_ICON = <Layers className="w-4 h-4" />;
const PACKAGE_ICON = <Package className="w-4 h-4" />;
const SEARCH_ICON = <Search className="w-4 h-4" />;
const NETWORK_ICON = <Network className="w-4 h-4" />;

export interface AICheckResponse {
  readonly url: string;
  readonly result: CheckResult;
}

interface AICheckResultProps {
  readonly data: AICheckResponse;
  readonly onReset: () => void;
  readonly ai: AiCheckStrings;
  readonly locale: string;
}

export function AICheckResult({ data, onReset, ai, locale }: AICheckResultProps): React.ReactElement {
  const { result } = data;
  const resultData = result.data;

  const knows = resultData.knows === true;
  const accuracy = typeof resultData.accuracy === 'string' ? resultData.accuracy : 'unknown';
  const hasUrl = resultData.hasUrl === true;
  const knowledgeDepth = typeof resultData.knowledgeDepth === 'string' ? resultData.knowledgeDepth : 'none';
  const productsKnown = resultData.productsKnown === true;
  const googlePresence = parseGooglePresence(resultData.googlePresence);
  const knowledgeGraphData = parseKnowledgeGraph(resultData.knowledgeGraph);
  const breakdown = parseBreakdown(resultData.breakdown);
  const { summary, details } = useMemo(() => {
    const rawSummary = locale === 'th' ? resultData.summaryTh : resultData.summaryEn;
    const rawDetails = locale === 'th' ? resultData.detailsTh : resultData.detailsEn;
    return {
      summary: typeof rawSummary === 'string' ? rawSummary : '',
      details: typeof rawDetails === 'string' ? rawDetails : '',
    };
  }, [locale, resultData.summaryTh, resultData.summaryEn, resultData.detailsTh, resultData.detailsEn]);
  const model = typeof resultData.model === 'string' ? resultData.model : 'gpt-4.1-nano';
  const skipped = resultData.skipped === true;

  const score = result.score;

  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500';
  const ringColor = score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-rose-500';

  const criteriaLabels = useMemo(() => ({
    whyMatters: ai.labelWhyMatters,
    howImprove: ai.labelHowImprove,
    howDetect: ai.labelHowDetect,
  }), [ai.labelWhyMatters, ai.labelHowImprove, ai.labelHowDetect]);

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
    if (!knowledgeGraphData) { return ai.aiOverviewNone; }
    if (knowledgeGraphData.hasKnowledgeGraph && knowledgeGraphData.hasAnswerBox) { return ai.aiOverviewFull; }
    if (knowledgeGraphData.hasKnowledgeGraph) { return ai.aiOverviewPartial; }
    if (knowledgeGraphData.hasAnswerBox) { return ai.aiOverviewAnswerOnly; }
    return ai.aiOverviewNone;
  }, [knowledgeGraphData, ai.aiOverviewFull, ai.aiOverviewPartial, ai.aiOverviewAnswerOnly, ai.aiOverviewNone]);

  // Must be declared before any early return to keep hook order stable across renders
  const breakdownItems: readonly BreakdownItem[] = useMemo(() => [
    { label: ai.knows, score: breakdown?.recognition ?? 0, max: 20 },
    { label: ai.accuracy, score: breakdown?.accuracy ?? 0, max: 15 },
    { label: ai.urlKnown, score: breakdown?.urlKnown ?? 0, max: 10 },
    { label: ai.knowledgeDepth, score: breakdown?.depth ?? 0, max: 15 },
    { label: ai.productsKnown, score: breakdown?.products ?? 0, max: 15 },
    { label: ai.googlePresence, score: breakdown?.googlePresence ?? 0, max: 10 },
    { label: ai.aiOverview, score: breakdown?.knowledgeGraph ?? 0, max: 15 },
  ], [ai.knows, ai.accuracy, ai.urlKnown, ai.knowledgeDepth, ai.productsKnown, ai.googlePresence, ai.aiOverview, breakdown]);

  const circumference = 2 * Math.PI * SCORE_RING_RADIUS;
  const offset = circumference - (score / 100) * circumference;

  if (skipped) {
    return (
      <AiCheckSkipped
        skippedLabel={ai.skipped}
        details={result.details}
        analyzeAnotherLabel={ai.analyzeAnother}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="animate-fade-up text-center mb-8">
        <p className="text-frost-500 text-sm mb-1">{ai.resultTitle}</p>
        <p className="text-frost-400 text-xs font-mono">{data.url}</p>
      </div>

      <div className="animate-fade-up stagger-1 flex justify-center mb-10">
        <div className="relative w-40 h-40" role="img" aria-label={`AI Visibility score: ${score} out of 100`}>
          <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
            <circle cx="60" cy="60" r={SCORE_RING_RADIUS} fill="none" stroke="currentColor" strokeWidth="6" className="text-frost-200/50" />
            <circle
              cx="60" cy="60" r={SCORE_RING_RADIUS} fill="none" strokeWidth="6"
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

      <div className="animate-fade-up stagger-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        <DimensionCard
          icon={knows ? CHECK_ICON : X_ICON}
          label={knows ? ai.knows : ai.doesNotKnow}
          value={`${breakdown?.recognition ?? 0}/20`}
          positive={knows}
        />
        <DimensionCard
          icon={EYE_ICON}
          label={ai.accuracy}
          value={ai.accuracyLevels[accuracy as keyof typeof ai.accuracyLevels] ?? accuracy}
          positive={accuracy === 'accurate'}
          neutral={accuracy === 'partial'}
        />
        <DimensionCard
          icon={LINK_ICON}
          label={hasUrl ? ai.urlKnown : ai.urlNotKnown}
          value={`${breakdown?.urlKnown ?? 0}/10`}
          positive={hasUrl}
        />
        <DimensionCard
          icon={LAYERS_ICON}
          label={ai.knowledgeDepth}
          value={ai.depthLevels[knowledgeDepth as keyof typeof ai.depthLevels] ?? knowledgeDepth}
          positive={knowledgeDepth === 'deep'}
          neutral={knowledgeDepth === 'moderate'}
        />
        <DimensionCard
          icon={PACKAGE_ICON}
          label={productsKnown ? ai.productsKnown : ai.productsNotKnown}
          value={`${breakdown?.products ?? 0}/15`}
          positive={productsKnown}
        />
        <DimensionCard
          icon={SEARCH_ICON}
          label={ai.googlePresence}
          value={googleLabel}
          positive={googlePresence?.topPosition !== null && (googlePresence?.topPosition ?? 99) <= 5}
          neutral={googlePresence?.topPosition !== null && (googlePresence?.topPosition ?? 99) <= 10}
        />
        <DimensionCard
          icon={NETWORK_ICON}
          label={ai.aiOverview}
          value={kgLabel}
          positive={knowledgeGraphData?.hasKnowledgeGraph === true}
          neutral={knowledgeGraphData?.hasAnswerBox === true && !knowledgeGraphData?.hasKnowledgeGraph}
        />
      </div>

      <ScoreBreakdown title={ai.scoreBreakdown} items={breakdownItems} />

      <AiCheckSummary
        summary={summary}
        details={details}
        summaryLabel={ai.summary}
        detailsLabel={ai.details}
      />

      <div className="animate-fade-up stagger-5 glass-card rounded-2xl p-6 mb-4">
        <h3 className="text-sm font-semibold text-frost-700 mb-3">{ai.scoringCriteria}</h3>
        <div className="space-y-2">
          {ai.criteriaItems.map((item) => (
            <CriteriaCard
              key={item.label}
              item={item}
              labels={criteriaLabels}
            />
          ))}
        </div>
      </div>

      <div className="animate-fade-up stagger-6 text-center mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-frost-100 text-frost-500 text-xs font-mono">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          {ai.model}: {model}
        </span>
      </div>

      <div className="animate-fade-up stagger-7 text-center">
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
