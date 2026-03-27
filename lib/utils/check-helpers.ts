import type { CheckResponse, CheckType, GradeInfo, StatusInfo, CheckLabel } from '@/lib/types/checker';

export type { CheckType, CheckLabel } from '@/lib/types/checker';

export const checkLabels: Record<CheckType, CheckLabel> = {
  schema: {
    title: 'Schema.org (JSON-LD)',
    description: 'Structured data for AI to understand content',
    weight: 18,
  },
  ssrCsr: {
    title: 'Server-Side Rendering',
    description: 'Content visible without JavaScript',
    weight: 14,
  },
  robotsTxt: {
    title: 'robots.txt',
    description: 'Tells AI which pages to access',
    weight: 11,
  },
  headingHierarchy: {
    title: 'Heading Hierarchy',
    description: 'Clear H1 → H2 → H3 order',
    weight: 9,
  },
  imageAI: {
    title: 'Image AI Readiness',
    description: 'Alt text and context for AI to understand images',
    weight: 8,
  },
  semanticHTML: {
    title: 'Semantic HTML',
    description: 'Meaningful HTML structure',
    weight: 7,
  },
  sitemap: {
    title: 'Sitemap.xml',
    description: 'Site map for AI discovery',
    weight: 7,
  },
  openGraph: {
    title: 'Open Graph',
    description: 'Preview tags for AI and social platforms',
    weight: 5,
  },
  llmsTxt: {
    title: 'llms.txt',
    description: 'LLM-specific guidance file',
    weight: 5,
  },
  faqBlocks: {
    title: 'FAQ/QA Blocks',
    description: 'Question-answer format for zero-click results',
    weight: 4,
  },
  authorAuthority: {
    title: 'Author Authority (E-E-A-T)',
    description: 'Author info and credibility signals',
    weight: 3,
  },
  pageSpeed: {
    title: 'Page Speed',
    description: 'Page loading performance for crawlers',
    weight: 4,
  },
  aiVisibility: {
    title: 'AI Visibility',
    description: 'Does AI recognize this website?',
    weight: 5,
  },
};

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

export function getStatusInfo(score: number, found: boolean): StatusInfo {
  if (score >= 80) {
    return { status: 'good', label: 'Present', icon: '✓' };
  } else if (score >= 50 || found) {
    return { status: 'partial', label: 'Partial', icon: '~' };
  } else {
    return { status: 'missing', label: 'Missing', icon: '×' };
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
