/**
 * Core types for AI Search Checker
 * Strict TypeScript interfaces with no 'any'
 */

export type CheckGrade = 'excellent' | 'good' | 'fair' | 'poor';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type CheckType =
  | 'schema'
  | 'ssrCsr'
  | 'robotsTxt'
  | 'headingHierarchy'
  | 'imageAI'
  | 'semanticHTML'
  | 'sitemap'
  | 'openGraph'
  | 'llmsTxt'
  | 'faqBlocks'
  | 'authorAuthority'
  | 'pageSpeed'
  | 'aiVisibility';

export interface CheckResult {
  readonly found: boolean;
  readonly details: string;
  readonly count?: number;
  readonly score: number;
  readonly data: Record<string, unknown>;
  readonly warnings?: readonly string[];
}

export interface Recommendation {
  readonly priority: PriorityLevel;
  readonly category: string;
  readonly message: string;
  readonly action: string;
}

export interface CheckSummary {
  readonly passed: number;
  readonly warning: number;
  readonly failed: number;
  readonly total: number;
}

export interface CheckResponse {
  readonly url: string;
  readonly overallScore: number;
  readonly grade: CheckGrade;
  readonly checks: Record<CheckType, CheckResult>;
  readonly recommendations: readonly Recommendation[];
  readonly summary: CheckSummary;
}

export interface CheckLabel {
  readonly title: string;
  readonly description: string;
  readonly weight: number;
}

export type CheckLabels = Record<CheckType, CheckLabel>;

export interface GradeInfo {
  readonly label: string;
  readonly color: string;
  readonly bgColor: string;
}

export interface StatusInfo {
  readonly status: 'good' | 'partial' | 'missing';
  readonly label: string;
  readonly icon: string;
}
