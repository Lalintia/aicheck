'use client';

import React from 'react';

export interface BreakdownItem {
  readonly label: string;
  readonly score: number;
  readonly max: number;
}

interface ScoreBreakdownProps {
  readonly title: string;
  readonly items: readonly BreakdownItem[];
}

export const ScoreBreakdown = React.memo(function ScoreBreakdown({
  title,
  items,
}: ScoreBreakdownProps): React.ReactElement {
  return (
    <div className="animate-fade-up stagger-3 glass-card rounded-2xl p-6 mb-4">
      <h3 className="text-sm font-semibold text-frost-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-frost-600 w-28 shrink-0 truncate">{item.label}</span>
            {/* Bar is purely visual — label + numeric score on either side already convey the value */}
            <div className="flex-1 h-2 bg-frost-100 rounded-full overflow-hidden" aria-hidden="true">
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
  );
});
