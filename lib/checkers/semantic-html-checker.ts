/**
 * Semantic HTML Checker
 * Validates proper use of semantic HTML5 elements
 * Weight: 5%
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';

interface SemanticElement {
  readonly tag: string;
  readonly weight: number;
}

const SEMANTIC_ELEMENTS: readonly SemanticElement[] = [
  { tag: '<header', weight: 15 },
  { tag: '<nav', weight: 15 },
  { tag: '<main', weight: 20 },
  { tag: '<article', weight: 15 },
  { tag: '<section', weight: 10 },
  { tag: '<aside', weight: 10 },
  { tag: '<footer', weight: 15 },
];

// Div-ratio penalty thresholds. Tuned for modern SPA frameworks (React/Next.js)
// which legitimately use many divs for layout scaffolding.
const DIV_RATIO_SEVERE = 50;
const DIV_RATIO_HIGH = 20;
const DIV_PENALTY_SEVERE = 15;
const DIV_PENALTY_HIGH = 8;

export function checkSemanticHTML(html: string): CheckResult {
  const found: string[] = [];
  const missing: string[] = [];
  let weightedScore = 0;

  // Count div elements to detect div soup
  const divCount = (html.match(/<div/gi) || []).length;
  const sectionCount = (html.match(/<section/gi) || []).length;
  const articleCount = (html.match(/<article/gi) || []).length;

  const htmlLower = html.toLowerCase();
  for (const element of SEMANTIC_ELEMENTS) {
    const hasElement = htmlLower.includes(element.tag);

    if (hasElement) {
      found.push(element.tag.replace('<', ''));
      weightedScore += element.weight;
    } else {
      missing.push(element.tag.replace('<', ''));
    }
  }

  const structuralElements = sectionCount + articleCount;
  const divRatio = structuralElements > 0 ? divCount / structuralElements : divCount;

  if (divRatio > DIV_RATIO_SEVERE) {
    weightedScore -= DIV_PENALTY_SEVERE;
  } else if (divRatio > DIV_RATIO_HIGH) {
    weightedScore -= DIV_PENALTY_HIGH;
  }

  // Check for role attributes (ARIA landmarks as fallback)
  const hasBanner = /role=["']banner["']/i.test(html);
  const hasNavigation = /role=["']navigation["']/i.test(html);
  const hasMain = /role=["']main["']/i.test(html);
  const hasContentinfo = /role=["']contentinfo["']/i.test(html);

  const ariaLandmarks = {
    banner: hasBanner,
    navigation: hasNavigation,
    main: hasMain,
    contentinfo: hasContentinfo,
  };

  // Add points for ARIA landmarks if semantic elements are missing
  if (!html.includes('<header') && hasBanner) weightedScore += 10;
  if (!html.includes('<nav') && hasNavigation) weightedScore += 10;
  if (!html.includes('<main') && hasMain) weightedScore += 10;
  if (!html.includes('<footer') && hasContentinfo) weightedScore += 10;

  const finalScore = Math.max(0, Math.min(100, weightedScore));

  const data: Record<string, unknown> = {
    elementsFound: found,
    elementsMissing: missing,
    divCount,
    sectionCount,
    articleCount,
    divRatio: Math.round(divRatio * 10) / 10,
    ariaLandmarks,
  };

  if (finalScore >= 70) {
    return createSuccessResult(
      `${found.length}/${SEMANTIC_ELEMENTS.length} semantic elements found`,
      finalScore,
      data
    );
  }

  if (finalScore >= 40) {
    return createPartialResult(
      `Limited semantic HTML: ${found.length}/${SEMANTIC_ELEMENTS.length} elements`,
      finalScore,
      data
    );
  }

  return createFailureResult(
    'Semantic HTML5 elements not found (div soup detected)',
    data
  );
}
