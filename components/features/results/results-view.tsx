'use client';

import type { ReactElement } from 'react';
import type { CheckResponse } from '@/lib/types/checker';
import { ScoreDisplay } from './components/score-display';
import { StatsSummary } from './components/stats-summary';
import { Checklist } from './components/checklist';
import { Recommendations } from './components/recommendations';
import { ResetButton } from './components/reset-button';

interface ResultsViewProps {
  readonly result: CheckResponse;
  readonly onReset: () => void;
}

export function ResultsView({ result, onReset }: ResultsViewProps): ReactElement {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 pt-10 relative z-10">
      {/* Bento Grid Hero — Score (2/3) + Stats (1/3) on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="animate-fade-up bento-tile glass-card glow-accent-strong lg:col-span-2 p-8 sm:p-10">
          <ScoreDisplay
            score={result.overallScore}
            grade={result.grade}
            url={result.url}
          />
        </div>
        <div className="animate-fade-up stagger-1 bento-tile glass-card p-6 sm:p-8 flex items-center">
          <div className="w-full">
            <StatsSummary
              passed={result.summary.passed}
              warning={result.summary.warning}
              failed={result.summary.failed}
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <Checklist checks={result.checks} />

      {/* Recommendations */}
      <Recommendations recommendations={result.recommendations} />

      {/* Reset Button */}
      <ResetButton onReset={onReset} />
    </div>
  );
}
