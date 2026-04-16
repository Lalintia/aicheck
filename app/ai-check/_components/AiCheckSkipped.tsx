'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AiCheckSkippedProps {
  readonly skippedLabel: string;
  readonly details: string;
  readonly analyzeAnotherLabel: string;
  readonly onReset: () => void;
}

export const AiCheckSkipped = React.memo(function AiCheckSkipped({
  skippedLabel,
  details,
  analyzeAnotherLabel,
  onReset,
}: AiCheckSkippedProps): React.ReactElement {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <div className="glass-card rounded-2xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-lg font-bold text-frost-900 mb-2">{skippedLabel}</h2>
        <p className="text-frost-600 mb-6">{details}</p>
        <button type="button" onClick={onReset} className="bg-frost-500 hover:bg-frost-600 text-white px-6 py-3 rounded-xl font-medium transition-all">
          {analyzeAnotherLabel}
        </button>
      </div>
    </div>
  );
});
