'use client';

import React from 'react';
import { Brain } from 'lucide-react';

interface AiCheckSummaryProps {
  readonly summary: string;
  readonly details: string;
  readonly summaryLabel: string;
  readonly detailsLabel: string;
}

export const AiCheckSummary = React.memo(function AiCheckSummary({
  summary,
  details,
  summaryLabel,
  detailsLabel,
}: AiCheckSummaryProps): React.ReactElement | null {
  if (!summary && !details) {
    return null;
  }

  return (
    <>
      {summary && (
        <div className="animate-fade-up stagger-4 glass-card rounded-2xl p-6 mb-4">
          <h3 className="text-sm font-semibold text-frost-700 mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" aria-hidden="true" />
            {summaryLabel}
          </h3>
          <p className="text-frost-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {details && (
        <div className="animate-fade-up stagger-4 glass-card rounded-2xl p-6 mb-4">
          <h3 className="text-sm font-semibold text-frost-700 mb-2">{detailsLabel}</h3>
          <p className="text-frost-600 leading-relaxed">{details}</p>
        </div>
      )}
    </>
  );
});
