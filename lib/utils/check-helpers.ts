import type { CheckResponse, CheckType, GradeInfo, CheckLabel } from '@/lib/types/checker';
import { weights } from '@/lib/checkers/base';

export type { CheckType, CheckLabel } from '@/lib/types/checker';

const labelMeta: Record<CheckType, { title: string; description: string }> = {
  schema: {
    title: 'Schema.org (JSON-LD)',
    description: 'Structured data for AI to understand content',
  },
  ssrCsr: {
    title: 'Server-Side Rendering',
    description: 'Content visible without JavaScript',
  },
  robotsTxt: {
    title: 'robots.txt',
    description: 'Tells AI which pages to access',
  },
  headingHierarchy: {
    title: 'Heading Hierarchy',
    description: 'Clear H1 \u2192 H2 \u2192 H3 order',
  },
  imageAI: {
    title: 'Image AI Readiness',
    description: 'Alt text and context for AI to understand images',
  },
  semanticHTML: {
    title: 'Semantic HTML',
    description: 'Meaningful HTML structure',
  },
  sitemap: {
    title: 'Sitemap.xml',
    description: 'Site map for AI discovery',
  },
  openGraph: {
    title: 'Open Graph',
    description: 'Preview tags for AI and social platforms',
  },
  llmsTxt: {
    title: 'llms.txt',
    description: 'LLM-specific guidance file',
  },
  pageSpeed: {
    title: 'Page Speed',
    description: 'Page loading performance for crawlers',
  },
};

const checkTypeKeys = Object.keys(labelMeta) as CheckType[];
export const checkLabels: Record<CheckType, CheckLabel> = Object.fromEntries(
  checkTypeKeys.map((key) => [
    key,
    { ...labelMeta[key], weight: weights[key] },
  ])
) as Record<CheckType, CheckLabel>;

export function getGradeLabel(grade: CheckResponse['grade']): GradeInfo {
  switch (grade) {
    case 'excellent':
      return { label: 'Excellent', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
    case 'good':
      return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    case 'fair':
      return { label: 'Fair', color: 'text-amber-600', bgColor: 'bg-amber-50' };
    case 'poor':
      return { label: 'Needs Work', color: 'text-rose-600', bgColor: 'bg-rose-50' };
  }
}

export function getPriorityColor(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'critical':
      return 'bg-rose-100 text-rose-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'low':
      return 'bg-blue-100 text-blue-700';
  }
}

export function getPriorityLabel(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  const labels: Record<typeof priority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return labels[priority];
}
