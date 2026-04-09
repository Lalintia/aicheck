'use client';

import { memo, useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CriteriaItem {
  readonly label: string;
  readonly max: string;
  readonly desc: string;
  readonly why: string;
  readonly howToImprove: string;
  readonly howDetected: string;
}

interface CriteriaLabels {
  readonly whyMatters: string;
  readonly howImprove: string;
  readonly howDetect: string;
}

interface CriteriaCardProps {
  readonly item: CriteriaItem;
  readonly labels: CriteriaLabels;
}

function CriteriaCardImpl({ item, labels }: CriteriaCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const hasDetails = item.why.length > 0 || item.howToImprove.length > 0 || item.howDetected.length > 0;

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
              <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">{labels.whyMatters}</p>
              <p className="text-[11px] text-frost-600 leading-relaxed">{item.why}</p>
            </div>
          )}
          {item.howToImprove && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">{labels.howImprove}</p>
              <p className="text-[11px] text-frost-600 leading-relaxed">{item.howToImprove}</p>
            </div>
          )}
          {item.howDetected && (
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">{labels.howDetect}</p>
              <p className="text-[11px] text-frost-600 leading-relaxed font-mono">{item.howDetected}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const CriteriaCard = memo(CriteriaCardImpl);
