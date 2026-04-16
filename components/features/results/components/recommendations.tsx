'use client';

import { AlertTriangle, AlertCircle, Lightbulb, ShieldCheck } from 'lucide-react';
import type { CheckResponse } from '@/lib/types/checker';
import { useI18n } from '@/lib/i18n';
import { RecommendationGroup } from './recommendation-group';

// Module-level icon constants — new JSX refs would defeat RecommendationGroup memo
const ROSE_ICON = <AlertTriangle className="w-4 h-4" />;
const AMBER_ICON = <AlertCircle className="w-4 h-4" />;
const BLUE_ICON = <Lightbulb className="w-4 h-4" />;

interface RecommendationsProps {
  readonly recommendations: CheckResponse['recommendations'];
}

export function Recommendations({ recommendations }: RecommendationsProps): React.ReactElement {
  const { t } = useI18n();

  if (recommendations.length === 0) {
    return (
      <div className="animate-fade-up stagger-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-frost-900">{t.results.allClear}</h2>
        </div>
        <p className="text-emerald-700">{t.results.allClearMessage}</p>
      </div>
    );
  }

  const critical = recommendations.filter((r) => r.priority === 'critical');
  const high = recommendations.filter((r) => r.priority === 'high');
  const medium = recommendations.filter((r) => r.priority === 'medium');
  const low = recommendations.filter((r) => r.priority === 'low');

  const urgentItems = [...critical, ...high];
  const urgentTitle = critical.length > 0 ? t.results.criticalIssues : t.results.highPriority;

  return (
    <div className="animate-fade-up stagger-4 glass-card rounded-3xl p-6 sm:p-8 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-frost-900">{t.results.recommendations}</h2>
          <p className="text-frost-500 text-sm">{t.results.itemsToImprove(recommendations.length)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <RecommendationGroup title={urgentTitle} count={urgentItems.length} items={urgentItems} color="rose" icon={ROSE_ICON} />
        <RecommendationGroup title={t.results.mediumPriority} count={medium.length} items={medium} color="amber" icon={AMBER_ICON} />
        <RecommendationGroup title={t.results.lowPriority} count={low.length} items={low} color="blue" icon={BLUE_ICON} />
      </div>
    </div>
  );
}
