'use client';

import { CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useId } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n';

type SchemaDetailsStrings = Translations['schemaDetails'];

export interface SchemaDetail {
  readonly score: number;
  readonly found: readonly string[];
  readonly missingRequired?: readonly string[];
  readonly missingRecommended?: readonly string[];
  readonly errors?: readonly string[];
  readonly warnings?: readonly string[];
  readonly specificType?: string;
  readonly itemCount?: number;
  readonly hasValidPositions?: boolean;
  readonly addressValid?: boolean;
  readonly hasRequiredFields?: boolean;
}

interface SchemaDetailsProps {
  readonly organizations?: readonly SchemaDetail[];
  readonly websites?: readonly SchemaDetail[];
  readonly articles?: readonly SchemaDetail[];
  readonly breadcrumbLists?: readonly SchemaDetail[];
  readonly localBusinesses?: readonly SchemaDetail[];
}

export function SchemaDetails({
  organizations,
  websites,
  articles,
  breadcrumbLists,
  localBusinesses,
}: SchemaDetailsProps): React.ReactElement | null {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();
  const s = t.schemaDetails;

  const hasAnyData =
    (organizations && organizations.length > 0) ||
    (websites && websites.length > 0) ||
    (articles && articles.length > 0) ||
    (breadcrumbLists && breadcrumbLists.length > 0) ||
    (localBusinesses && localBusinesses.length > 0);

  if (!hasAnyData) {
    return (
      <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
        <p className="text-rose-700 text-sm">{s.noneFound}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
        {s.title}
      </button>

      <div id={panelId} hidden={!expanded} className="mt-3 space-y-3">
        {organizations && organizations.map((org, i) => (
          <SchemaTypeDetail
            key={`org-${org.specificType ?? org.found[0] ?? i}`}
            type="Organization"
            detail={org}
            description={s.descriptions.organization}
            strings={s}
          />
        ))}

        {websites && websites.map((web, i) => (
          <SchemaTypeDetail
            key={`web-${web.found[0] ?? i}`}
            type="WebSite"
            detail={web}
            description={s.descriptions.website}
            strings={s}
          />
        ))}

        {articles && articles.map((art, i) => (
          <SchemaTypeDetail
            key={`art-${art.specificType ?? art.found[0] ?? i}`}
            type={art.specificType || 'Article'}
            detail={art}
            description={s.descriptions.article}
            strings={s}
          />
        ))}

        {breadcrumbLists && breadcrumbLists.map((bc, i) => (
          <SchemaTypeDetail
            key={`bc-${bc.itemCount ?? bc.found[0] ?? i}`}
            type="BreadcrumbList"
            detail={bc}
            description={s.descriptions.breadcrumb}
            strings={s}
          />
        ))}

        {localBusinesses && localBusinesses.map((lb, i) => (
          <SchemaTypeDetail
            key={`lb-${lb.specificType ?? lb.found[0] ?? i}`}
            type={lb.specificType || 'LocalBusiness'}
            detail={lb}
            description={s.descriptions.localBusiness}
            strings={s}
          />
        ))}
      </div>
    </div>
  );
}

interface SchemaTypeDetailProps {
  readonly type: string;
  readonly detail: SchemaDetail;
  readonly description: string;
  readonly strings: SchemaDetailsStrings;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-200';
}

function getIcon(score: number): React.ReactElement {
  if (score >= 80) return <CheckCircle className="w-4 h-4 text-emerald-600" />;
  if (score >= 50) return <AlertCircle className="w-4 h-4 text-amber-600" />;
  return <XCircle className="w-4 h-4 text-rose-600" />;
}

function SchemaTypeDetail({ type, detail, description, strings: s }: SchemaTypeDetailProps): React.ReactElement {
  const [showDetails, setShowDetails] = useState(false);
  const detailsPanelId = useId();

  const missingRequired = detail.missingRequired || [];
  const missingRecommended = detail.missingRecommended || [];
  const errors = detail.errors || [];
  const warnings = detail.warnings || [];

  return (
    <div className={`rounded-xl border p-4 ${getScoreBg(detail.score)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon(detail.score)}
          <div>
            <h4 className="font-semibold text-gray-900">{type}</h4>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${getScoreColor(detail.score)}`}>
            {detail.score}%
          </span>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls={detailsPanelId}
            aria-label={s.toggleDetailsLabel(showDetails ? s.hide : s.details, type)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            {showDetails ? s.hide : s.details}
          </button>
        </div>
      </div>

      <div id={detailsPanelId} hidden={!showDetails}>
        {showDetails && (
        <div className="mt-3 space-y-2 text-sm">
          {detail.found.length > 0 && (
            <div>
              <p className="text-gray-700 font-medium">✓ {s.found} ({detail.found.length}):</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {detail.found.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missingRequired.length > 0 && (
            <div className="mt-2">
              <p className="text-rose-700 font-medium">✗ {s.missingRequired} ({missingRequired.length}):</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {missingRequired.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missingRecommended.length > 0 && (
            <div className="mt-2">
              <p className="text-amber-700 font-medium">○ {s.missingRecommended} ({missingRecommended.length}):</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {missingRecommended.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-2 p-2 bg-rose-100 rounded-lg">
              <p className="text-rose-800 font-medium">{s.errors}:</p>
              <ul className="list-disc list-inside text-rose-700 text-xs mt-1">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mt-2 p-2 bg-amber-100 rounded-lg">
              <p className="text-amber-800 font-medium">{s.warnings}:</p>
              <ul className="list-disc list-inside text-amber-700 text-xs mt-1">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {detail.itemCount !== undefined && (
            <p className="text-gray-600 mt-2">{s.items}: {detail.itemCount}</p>
          )}
          {detail.hasValidPositions !== undefined && (
            <p className="text-gray-600">
              {s.validPositions}: {detail.hasValidPositions ? '✓' : '✗'}
            </p>
          )}
          {detail.addressValid !== undefined && (
            <p className="text-gray-600">
              {s.validAddress}: {detail.addressValid ? '✓' : '✗'}
            </p>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
