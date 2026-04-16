/**
 * Heading Hierarchy Checker
 * Validates proper heading structure (H1-H6)
 * Weight: see `weights.headingHierarchy` in `./base.ts` (single source of truth)
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';
import { sanitizeContent } from '@/lib/security';

export function checkHeadingHierarchy(html: string): CheckResult {
  const warnings: string[] = [];

  // Extract all headings with their levels
  // Use indexOf instead of [\s\S]*? regex to avoid ReDoS on malformed HTML
  const headings: { level: number; text: string }[] = [];
  let pos = 0;

  while (headings.length < 100 && pos < html.length) {
    const start = html.indexOf('<h', pos);
    if (start === -1) break;

    // Confirm h1-h6, not <header>, <html>, etc.
    const levelChar = start + 2 < html.length ? html[start + 2] : '';
    if (!'123456'.includes(levelChar)) {
      pos = start + 2;
      continue;
    }
    const charAfter = start + 3 < html.length ? html[start + 3] : '';
    if (charAfter !== '' && charAfter !== '>' && charAfter !== ' ' &&
        charAfter !== '\t' && charAfter !== '\n' && charAfter !== '\r') {
      pos = start + 3;
      continue;
    }

    const tagEnd = html.indexOf('>', start);
    if (tagEnd === -1) break;

    const contentStart = tagEnd + 1;
    const closeTag = `</h${levelChar}>`;
    const contentEnd = html.indexOf(closeTag, contentStart);
    if (contentEnd === -1 || contentEnd - contentStart > 5000) {
      pos = tagEnd + 1;
      continue;
    }

    const rawText = html.slice(contentStart, contentEnd).replace(/<[^>]+>/g, '').trim();
    if (rawText) {
      headings.push({ level: parseInt(levelChar, 10), text: sanitizeContent(rawText, 200) });
    }
    pos = contentEnd + closeTag.length;
  }

  if (headings.length === 0) {
    return createFailureResult('No headings found (H1-H6)', {
      headings: [],
    });
  }

  // Count H1s (should be exactly 1)
  const h1Count = headings.filter((h) => h.level === 1).length;
  const h2Count = headings.filter((h) => h.level === 2).length;
  const h3Count = headings.filter((h) => h.level === 3).length;

  // Check for hierarchy violations
  let violations = 0;
  let prevLevel = 0;

  for (const heading of headings) {
    if (heading.level > prevLevel + 1) {
      violations++;
    }
    prevLevel = heading.level;
  }

  // Generate warnings
  if (h1Count === 0) {
    warnings.push('Missing H1 tag (critical for SEO)');
  } else if (h1Count > 1) {
    warnings.push(`Multiple H1 tags found (${h1Count}), should have only 1`);
  }

  if (violations > 0) {
    warnings.push(`Heading hierarchy violations found (${violations} skips)`);
  }

  // Calculate score
  let score = 100;
  if (h1Count === 0) score -= 30;
  if (h1Count > 1) score -= 20;
  if (violations > 0) score -= violations * 10;
  if (h2Count === 0) score -= 15;

  score = Math.max(0, score);

  const data: Record<string, unknown> = {
    h1Count,
    h2Count,
    h3Count,
    totalHeadings: headings.length,
    violations,
    headings: headings.slice(0, 10), // First 10 headings
  };

  if (score >= 80) {
    return createSuccessResult(
      `Heading hierarchy correct (${headings.length} headings)`,
      score,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  if (score >= 50) {
    return createPartialResult(
      `Heading hierarchy needs improvement`,
      score,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  return createPartialResult(
    'Heading hierarchy has significant issues',
    score,
    data,
    warnings.length > 0 ? warnings : undefined
  );
}
