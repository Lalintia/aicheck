/**
 * Semantic HTML Checker
 * Validates proper use of semantic HTML5 elements
 * Weight: see `weights.semanticHTML` in `./base.ts` (single source of truth)
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

// Count occurrences of a literal substring without allocating a match array.
// Case-insensitive by scanning both lowercase and uppercase forms of the tag.
function countTag(html: string, tag: string): number {
  const lower = tag.toLowerCase();
  const upper = tag.toUpperCase();
  let count = 0;
  let pos = 0;
  while ((pos = html.indexOf(lower, pos)) !== -1) {
    count++;
    pos += lower.length;
  }
  pos = 0;
  while ((pos = html.indexOf(upper, pos)) !== -1) {
    count++;
    pos += upper.length;
  }
  return count;
}

export function checkSemanticHTML(html: string): CheckResult {
  const found: string[] = [];
  const missing: string[] = [];
  let weightedScore = 0;

  // Count div elements to detect div soup (counter loop — no array allocation)
  const divCount = countTag(html, '<div');
  const sectionCount = countTag(html, '<section');
  const articleCount = countTag(html, '<article');

  for (const element of SEMANTIC_ELEMENTS) {
    const hasElement = countTag(html, element.tag) > 0;

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
  if (countTag(html, '<header') === 0 && hasBanner) weightedScore += 10;
  if (countTag(html, '<nav') === 0 && hasNavigation) weightedScore += 10;
  if (countTag(html, '<main') === 0 && hasMain) weightedScore += 10;
  if (countTag(html, '<footer') === 0 && hasContentinfo) weightedScore += 10;

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
