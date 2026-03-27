/**
 * Base types and utilities for checkers
 */

import type { CheckResult, CheckGrade, Recommendation } from '@/lib/types/checker';

export type { CheckResult };

export interface Checker {
  name: string;
  weight: number;
  check(url: string, html: string): Promise<CheckResult> | CheckResult;
}

// Updated weights for AI Search readiness (2026)
// 13 checks ordered by importance for AI Search visibility
// Total: 100%
export const weights = {
  schema: 18,           // Most important for AI understanding
  ssrCsr: 14,           // Critical: if CSR, AI sees blank page
  robotsTxt: 11,        // Controls AI bot access
  headingHierarchy: 9,  // Clear document structure
  imageAI: 8,           // Image alt text for AI understanding
  semanticHTML: 7,      // Better structure helps AI parse content
  sitemap: 7,           // Helps AI discover content
  openGraph: 5,         // Social/AI preview cards
  llmsTxt: 5,           // LLM-specific guidance file
  faqBlocks: 4,         // FAQ content for zero-click results
  authorAuthority: 3,   // E-E-A-T signals
  pageSpeed: 4,         // Core Web Vitals for crawling
  aiVisibility: 5,      // Real AI recognition check
} as const;

export type CheckType = keyof typeof weights;

export function getGrade(score: number): CheckGrade {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

export function calculateOverallScore(
  checks: Record<string, CheckResult>,
  weightMap: Record<string, number>
): number {
  let totalScore = 0;
  for (const [key, weight] of Object.entries(weightMap)) {
    const check = checks[key];
    if (check) {
      totalScore += (check.score || 0) * (weight / 100);
    }
  }
  return Math.round(totalScore);
}

export function generateRecommendations(
  checks: Record<CheckType, CheckResult>
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (!checks.schema.found || checks.schema.score! < 80) {
    recommendations.push({
      priority: 'critical',
      category: 'Schema.org',
      message: 'Schema.org JSON-LD not found or incomplete',
      action: 'Install Schema.org JSON-LD (Organization, WebSite)',
    });
  }

  if (checks.ssrCsr.score! < 50) {
    recommendations.push({
      priority: 'critical',
      category: 'SSR/CSR',
      message: 'AI crawlers may see a blank page — content loads via JavaScript',
      action: 'Enable Server-Side Rendering (SSR) or Static Site Generation (SSG)',
    });
  } else if (checks.ssrCsr.score! < 80) {
    recommendations.push({
      priority: 'high',
      category: 'SSR/CSR',
      message: 'Content is partially server-rendered',
      action: 'Ensure critical content is in initial HTML, not loaded via JavaScript',
    });
  }

  if (!checks.robotsTxt.found) {
    recommendations.push({
      priority: 'critical',
      category: 'robots.txt',
      message: 'robots.txt not found',
      action: 'Create robots.txt and specify Sitemap',
    });
  } else if (checks.robotsTxt.warnings?.some((w) => w.includes('GPTBot'))) {
    recommendations.push({
      priority: 'high',
      category: 'robots.txt',
      message: 'May block AI crawlers',
      action: 'Ensure GPTBot, ChatGPT-User are not blocked',
    });
  }

  if (checks.headingHierarchy.score! < 70) {
    recommendations.push({
      priority: 'medium',
      category: 'Headings',
      message: 'Heading Hierarchy issues',
      action: 'Have 1 H1, followed by H2, H3 in order',
    });
  }

  if (checks.imageAI.score! < 50) {
    recommendations.push({
      priority: 'high',
      category: 'Images',
      message: 'Most images missing alt text — AI cannot understand your images',
      action: 'Add descriptive alt text to all content images',
    });
  } else if (checks.imageAI.score! < 80) {
    recommendations.push({
      priority: 'medium',
      category: 'Images',
      message: 'Some images missing alt text',
      action: 'Add alt text and consider using <figure>/<figcaption> for context',
    });
  }

  if (!checks.semanticHTML.found) {
    recommendations.push({
      priority: 'medium',
      category: 'Semantic HTML',
      message: 'Too many <div> elements',
      action: 'Use semantic elements: <header>, <main>, <article>, <section>',
    });
  }

  if (!checks.sitemap.found) {
    recommendations.push({
      priority: 'high',
      category: 'Sitemap',
      message: 'Sitemap.xml not found',
      action: 'Create Sitemap.xml and reference it in robots.txt',
    });
  }

  if (checks.openGraph.score! < 50) {
    recommendations.push({
      priority: 'medium',
      category: 'Open Graph',
      message: 'Open Graph tags missing or incomplete',
      action: 'Add og:title, og:description, og:image for better AI/social previews',
    });
  }

  if (!checks.llmsTxt.found || checks.llmsTxt.score! < 60) {
    recommendations.push({
      priority: 'medium',
      category: 'llms.txt',
      message: checks.llmsTxt.found ? 'llms.txt needs improvement' : 'llms.txt file not found',
      action: 'Create llms.txt following Answer.AI standard',
    });
  }

  if (!checks.faqBlocks.found) {
    recommendations.push({
      priority: 'low',
      category: 'FAQ',
      message: 'No FAQ/QA blocks found',
      action: 'Add FAQ Schema and Q&A format',
    });
  }

  if (!checks.authorAuthority.found) {
    recommendations.push({
      priority: 'low',
      category: 'EEAT',
      message: 'No author information found',
      action: 'Add Author meta, Publisher info per EEAT guidelines',
    });
  }

  if (checks.pageSpeed.score! < 60) {
    recommendations.push({
      priority: 'high',
      category: 'Performance',
      message: 'Website loads slowly',
      action: 'Improve Core Web Vitals, optimize images',
    });
  }

  if (checks.aiVisibility.score! < 50 && !checks.aiVisibility.data?.skipped) {
    recommendations.push({
      priority: 'high',
      category: 'AI Visibility',
      message: 'AI does not recognize this website or organization',
      action: 'Increase online presence — create quality content, get mentions on authoritative sites',
    });
  }

  return recommendations;
}

export function createSuccessResult(
  details: string,
  score: number,
  data?: Record<string, unknown>,
  warnings?: string[]
): CheckResult {
  return {
    found: true,
    details,
    score,
    data: data || {},
    ...(warnings && warnings.length > 0 ? { warnings } : {}),
  };
}

export function createFailureResult(
  details: string,
  data?: Record<string, unknown>
): CheckResult {
  return {
    found: false,
    details,
    score: 0,
    data: data || {},
  };
}

export function createPartialResult(
  details: string,
  score: number,
  data?: Record<string, unknown>,
  warnings?: string[]
): CheckResult {
  return {
    found: score > 0,
    details,
    score,
    data: data || {},
    ...(warnings && warnings.length > 0 ? { warnings } : {}),
  };
}
