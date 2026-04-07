'use client';

import { CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useId } from 'react';

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
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();

  const hasAnyData = 
    (organizations && organizations.length > 0) ||
    (websites && websites.length > 0) ||
    (articles && articles.length > 0) ||
    (breadcrumbLists && breadcrumbLists.length > 0) ||
    (localBusinesses && localBusinesses.length > 0);

  if (!hasAnyData) {
    return (
      <div className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
        <p className="text-rose-700 text-sm">
          ❌ No Schema.org JSON-LD found. This is critical for AI Search visibility.
        </p>
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
        Schema Details
      </button>

      {expanded && (
        <div id={panelId} className="mt-3 space-y-3">
          {organizations && organizations.map((org, i) => (
            <SchemaTypeDetail
              key={`org-${i}`}
              type="Organization"
              detail={org}
              description="Represents your business/organization to AI"
            />
          ))}

          {websites && websites.map((web, i) => (
            <SchemaTypeDetail
              key={`web-${i}`}
              type="WebSite"
              detail={web}
              description="Represents your website structure"
            />
          ))}

          {articles && articles.map((art, i) => (
            <SchemaTypeDetail
              key={`art-${i}`}
              type={art.specificType || 'Article'}
              detail={art}
              description="Content article markup"
            />
          ))}

          {breadcrumbLists && breadcrumbLists.map((bc, i) => (
            <SchemaTypeDetail
              key={`bc-${i}`}
              type="BreadcrumbList"
              detail={bc}
              description="Navigation structure for AI"
            />
          ))}

          {localBusinesses && localBusinesses.map((lb, i) => (
            <SchemaTypeDetail
              key={`lb-${i}`}
              type={lb.specificType || 'LocalBusiness'}
              detail={lb}
              description="Local business information"
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SchemaTypeDetailProps {
  readonly type: string;
  readonly detail: SchemaDetail;
  readonly description: string;
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

function SchemaTypeDetail({ type, detail, description }: SchemaTypeDetailProps): React.ReactElement {
  const [showDetails, setShowDetails] = useState(false);

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
            aria-label={`${showDetails ? 'Hide' : 'Show'} details for ${type} schema`}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2 text-sm">
          {/* Found Fields */}
          {detail.found.length > 0 && (
            <div>
              <p className="text-gray-700 font-medium">✓ Found ({detail.found.length}):</p>
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

          {/* Missing Required */}
          {missingRequired.length > 0 && (
            <div className="mt-2">
              <p className="text-rose-700 font-medium">✗ Missing Required ({missingRequired.length}):</p>
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

          {/* Missing Recommended */}
          {missingRecommended.length > 0 && (
            <div className="mt-2">
              <p className="text-amber-700 font-medium">○ Missing Recommended ({missingRecommended.length}):</p>
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

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-2 p-2 bg-rose-100 rounded-lg">
              <p className="text-rose-800 font-medium">Errors:</p>
              <ul className="list-disc list-inside text-rose-700 text-xs mt-1">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-2 p-2 bg-amber-100 rounded-lg">
              <p className="text-amber-800 font-medium">Warnings:</p>
              <ul className="list-disc list-inside text-amber-700 text-xs mt-1">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Info */}
          {detail.itemCount !== undefined && (
            <p className="text-gray-600 mt-2">Items: {detail.itemCount}</p>
          )}
          {detail.hasValidPositions !== undefined && (
            <p className="text-gray-600">
              Valid positions: {detail.hasValidPositions ? '✓' : '✗'}
            </p>
          )}
          {detail.addressValid !== undefined && (
            <p className="text-gray-600">
              Valid address: {detail.addressValid ? '✓' : '✗'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
