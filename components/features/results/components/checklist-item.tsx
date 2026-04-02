'use client';

import { CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import type { CheckResult, CheckType } from '@/lib/types/checker';
import { useI18n } from '@/lib/i18n';
import { checkLabels } from '@/lib/utils/check-helpers';
import { SchemaDetails, type SchemaDetail } from './schema-details';
import { CheckReferenceButton } from './check-references';

type StatusType = 'good' | 'partial' | 'missing';

interface ChecklistItemProps {
  readonly index: number;
  readonly check: CheckResult;
  readonly checkType: CheckType;
}

interface SchemaCheckData {
  readonly organizations?: readonly SchemaDetail[];
  readonly websites?: readonly SchemaDetail[];
  readonly articles?: readonly SchemaDetail[];
  readonly breadcrumbLists?: readonly SchemaDetail[];
  readonly localBusinesses?: readonly SchemaDetail[];
}

export function ChecklistItem({ index, check, checkType }: ChecklistItemProps): React.ReactElement {
  const { t } = useI18n();
  const status = getStatusInfo(check.score, check.found, t);
  const isSchema = checkType === 'schema';
  const isAIVisibility = checkType === 'aiVisibility';

  const label = t.checks[checkType] || checkLabels[checkType];
  const weight = checkLabels[checkType]?.weight;

  return (
    <div
      style={{ animationDelay: `${index * 50}ms` }}
      className={`animate-fade-up p-4 rounded-xl transition-all duration-200 hover:scale-[1.005] ${
        isAIVisibility
          ? 'ai-badge'
          : 'bg-frost-50/50 hover:bg-frost-100/80 border border-frost-200/50 hover:border-frost-300/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-frost-400 font-mono text-sm w-6 flex-shrink-0 text-right">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-frost-900 text-sm sm:text-base truncate flex items-center gap-2">
              {label.title}
              {isAIVisibility && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-frost-500/10 text-frost-600 text-xs font-medium">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  AI
                </span>
              )}
              {weight !== undefined && (
                <span className="text-frost-400 text-xs font-normal hidden sm:inline">
                  {weight}%
                </span>
              )}
            </h3>
            <p className="text-frost-500 text-xs hidden sm:block">{label.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`font-mono text-sm font-bold ${
            check.score >= 80 ? 'text-emerald-600' :
            check.score >= 50 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {check.score}
          </span>

          <CheckReferenceButton checkType={checkType} />

          <span
            aria-label={status.label}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
              status.status === 'good'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : status.status === 'partial'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <span aria-hidden="true">{status.icon}</span>
            <span className="hidden sm:inline">{status.label}</span>
          </span>
        </div>
      </div>

      {isSchema && check.data && (
        <SchemaDetails {...(check.data as SchemaCheckData)} />
      )}
    </div>
  );
}

interface StatusInfo {
  readonly status: StatusType;
  readonly label: string;
  readonly icon: React.ReactNode;
}

interface StatusTranslations {
  readonly results: {
    readonly pass: string;
    readonly partial: string;
    readonly fail: string;
  };
}

function getStatusInfo(score: number, found: boolean, t: StatusTranslations): StatusInfo {
  if (score >= 80) {
    return { status: 'good', label: t.results.pass, icon: <CheckCircle className="w-3.5 h-3.5" /> };
  }
  if (found || score >= 50) {
    return { status: 'partial', label: t.results.partial, icon: <AlertTriangle className="w-3.5 h-3.5" /> };
  }
  return { status: 'missing', label: t.results.fail, icon: <XCircle className="w-3.5 h-3.5" /> };
}
