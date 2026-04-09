/**
 * FAQ Blocks Checker
 * Validates FAQ/QA structured blocks on the page
 * Weight: 5%
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';

interface FAQPattern {
  readonly name: string;
  readonly pattern: RegExp;
  readonly weight: number;
}

const FAQ_PATTERNS: readonly FAQPattern[] = [
  { name: 'FAQPage Schema', pattern: /"@type":\s*"FAQPage"/i, weight: 40 },
  { name: 'details/summary', pattern: /<details\s*>/i, weight: 20 },
  { name: 'FAQ class', pattern: /class=["'][^"']*faq/i, weight: 15 },
  { name: 'Accordion class', pattern: /class=["'][^"']*accordion/i, weight: 15 },
  { name: 'Question heading', pattern: /<h[2-4][^>]*>[^<]{0,200}(คำถาม|FAQ|ถามบ่อย|Q&A|Questions)/i, weight: 10 },
  { name: 'Question class', pattern: /class=["'][^"']*question/i, weight: 10 },
];

export function checkFAQBlocks(html: string): CheckResult {
  let hasFAQSchema = false;
  const foundPatterns: string[] = [];
  let weightedScore = 0;

  for (const pattern of FAQ_PATTERNS) {
    if (weightedScore >= 100) { break; }
    const matches = pattern.pattern.test(html);
    if (matches) {
      foundPatterns.push(pattern.name);
      weightedScore += pattern.weight;

      if (pattern.name === 'FAQPage Schema') {
        hasFAQSchema = true;
      }
    }
  }

  // Cap score at 100
  const finalScore = Math.min(100, weightedScore);

  const data: Record<string, unknown> = {
    hasFAQSchema,
    patternsFound: foundPatterns,
    patternCount: foundPatterns.length,
  };

  if (finalScore >= 80) {
    return createSuccessResult(
      hasFAQSchema ? 'FAQPage Schema found' : `FAQ patterns found (${foundPatterns.length})`,
      finalScore,
      data
    );
  }

  if (finalScore >= 40) {
    return createPartialResult(
      `FAQ patterns found (${foundPatterns.length})`,
      finalScore,
      data
    );
  }

  return createFailureResult('No FAQ/QA blocks found', data);
}
