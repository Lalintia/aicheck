'use client';

import { useMemo } from 'react';
import { AlertTriangle, Brain, CheckCircle, Eye, Layers, Link2, Network, Package, Search, Sparkles, XCircle } from 'lucide-react';
import type { CheckResult } from '@/lib/types/checker';
import { parseBreakdown, parseGooglePresence, parseKnowledgeGraph } from '../_lib/parsers';
import type { AiCheckStrings } from '../_lib/default-ai-check';
import { DimensionCard } from './dimension-card';
import { CriteriaCard } from './criteria-card';

export interface AICheckResponse {
  readonly url: string;
  readonly result: CheckResult;
}

interface AICheckResultProps {
  readonly data: AICheckResponse;
  readonly onReset: () => void;
  readonly ai: AiCheckStrings;
}

export function AICheckResult({ data, onReset, ai }: AICheckResultProps): React.ReactElement {
  const { result } = data;
  const d = result.data;

  const knows = d.knows === true;
  const accuracy = typeof d.accuracy === 'string' ? d.accuracy : 'unknown';
  const hasUrl = d.hasUrl === true;
  const knowledgeDepth = typeof d.knowledgeDepth === 'string' ? d.knowledgeDepth : 'none';
  const productsKnown = d.productsKnown === true;
  const googlePresence = parseGooglePresence(d.googlePresence);
  const knowledgeGraphData = parseKnowledgeGraph(d.knowledgeGraph);
  const breakdown = parseBreakdown(d.breakdown);
  const summary = typeof d.summary === 'string' ? d.summary : '';
  const details = typeof d.details === 'string' ? d.details : '';
  const model = typeof d.model === 'string' ? d.model : 'gpt-4.1-nano';
  const skipped = d.skipped === true;

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
    { label: ai.aiOverview, score: breakdown?.knowledgeGraph ?? 0, max: 15 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="animate-fade-up text-center mb-8">
        <p className="text-frost-500 text-sm mb-1">{ai.resultTitle}</p>
        <p className="text-frost-400 text-xs font-mono">{data.url}</p>
      </div>

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

      <div className="animate-fade-up stagger-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        <DimensionCard
          icon={knows ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          label={knows ? ai.knows : ai.doesNotKnow}
          value={`${breakdown?.recognition ?? 0}/20`}
          positive={knows}
        />
        <DimensionCard
          icon={<Eye className="w-4 h-4" />}
          label={ai.accuracy}
          value={ai.accuracyLevels[accuracy as keyof typeof ai.accuracyLevels] ?? accuracy}
          positive={accuracy === 'accurate'}
          neutral={accuracy === 'partial'}
        />
        <DimensionCard
          icon={<Link2 className="w-4 h-4" />}
          label={hasUrl ? ai.urlKnown : ai.urlNotKnown}
          value={`${breakdown?.urlKnown ?? 0}/10`}
          positive={hasUrl}
        />
        <DimensionCard
          icon={<Layers className="w-4 h-4" />}
          label={ai.knowledgeDepth}
          value={ai.depthLevels[knowledgeDepth as keyof typeof ai.depthLevels] ?? knowledgeDepth}
          positive={knowledgeDepth === 'deep'}
          neutral={knowledgeDepth === 'moderate'}
        />
        <DimensionCard
          icon={<Package className="w-4 h-4" />}
          label={productsKnown ? ai.productsKnown : ai.productsNotKnown}
          value={`${breakdown?.products ?? 0}/15`}
          positive={productsKnown}
        />
        <DimensionCard
          icon={<Search className="w-4 h-4" />}
          label={ai.googlePresence}
          value={googleLabel}
          positive={googlePresence?.topPosition !== null && (googlePresence?.topPosition ?? 99) <= 5}
          neutral={googlePresence?.topPosition !== null && (googlePresence?.topPosition ?? 99) <= 10}
        />
        <DimensionCard
          icon={<Network className="w-4 h-4" />}
          label={ai.aiOverview}
          value={kgLabel}
          positive={knowledgeGraphData?.hasKnowledgeGraph === true}
          neutral={knowledgeGraphData?.hasAnswerBox === true && !knowledgeGraphData?.hasKnowledgeGraph}
        />
      </div>

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
