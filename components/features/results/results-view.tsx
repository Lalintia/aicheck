'use client';

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

export function ResultsView({ result, onReset }: ResultsViewProps): React.ReactElement {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 pt-10 relative z-10">
      {/* Score Card */}
      <div className="animate-fade-up glass-card rounded-3xl p-8 sm:p-10 mb-6 glow-accent-strong">
        <ScoreDisplay
          score={result.overallScore}
          grade={result.grade}
          url={result.url}
        />
        <StatsSummary
          passed={result.summary.passed}
          warning={result.summary.warning}
          failed={result.summary.failed}
        />
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
