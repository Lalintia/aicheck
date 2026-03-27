'use client';

import type { CheckResponse, CheckType } from '@/lib/types/checker';
import { useI18n } from '@/lib/i18n';
import { ChecklistItem } from './checklist-item';

interface ChecklistProps {
  readonly checks: CheckResponse['checks'];
}

const CHECK_ORDER: CheckType[] = [
  'schema', 'ssrCsr', 'robotsTxt', 'headingHierarchy', 'imageAI',
  'semanticHTML', 'sitemap', 'openGraph', 'llmsTxt', 'faqBlocks',
  'authorAuthority', 'pageSpeed', 'aiVisibility',
];

export function Checklist({ checks }: ChecklistProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="animate-fade-up stagger-2 glass-card rounded-3xl p-6 sm:p-8 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-frost-900">{t.results.checklist}</h2>
        <span className="text-frost-400 text-sm font-mono">{t.results.checksCount}</span>
      </div>

      <div className="space-y-2">
        {CHECK_ORDER.map((key, index) => (
          <ChecklistItem
            key={key}
            index={index}
            check={checks[key]}
            checkType={key}
          />
        ))}
      </div>
    </div>
  );
}
