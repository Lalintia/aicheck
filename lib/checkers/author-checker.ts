/**
 * Author Authority Checker
 * Validates author and publisher information (E-E-A-T)
 * Weight: 5%
 */

import type { CheckResult } from './base';
import { createSuccessResult, createPartialResult, createFailureResult } from './base';

interface AuthorityCheck {
  readonly name: string;
  readonly pattern: RegExp;
  readonly weight: number;
}

// Modern sites put authorship in JSON-LD, not legacy <meta> tags.
// We accept either source — score is capped at 100 in the caller.
const AUTHORITY_CHECKS: readonly AuthorityCheck[] = [
  {
    name: 'meta-author',
    pattern: /<meta[^>]*name=["']author["'][^>]*>/i,
    weight: 25,
  },
  {
    // Matches JSON-LD author as object, array of objects, or string.
    // Using a broad "open bracket or string" heuristic because regex cannot
    // reliably parse nested JSON — score is capped at 100 so overmatch is OK.
    name: 'jsonld-author',
    pattern: /"author"\s*:\s*[{["]/i,
    weight: 25,
  },
  {
    name: 'meta-publisher',
    pattern: /<meta[^>]*name=["']publisher["'][^>]*>/i,
    weight: 25,
  },
  {
    name: 'jsonld-publisher',
    pattern: /"publisher"\s*:\s*\{/i,
    weight: 25,
  },
  {
    name: 'organization',
    pattern: /"@type":\s*"Organization"/i,
    weight: 20,
  },
  {
    name: 'datePublished',
    pattern: /"datePublished"\s*:/i,
    weight: 10,
  },
  {
    name: 'byline',
    pattern: /class=["'][^"']{0,100}(?:byline|author)["']/i,
    weight: 15,
  },
  {
    name: 'authorBio',
    pattern: /(ประวัติ|bio|about.{0,50}author)/i,
    weight: 10,
  },
];

export function checkAuthorAuthority(html: string): CheckResult {
  const found: string[] = [];
  const missing: string[] = [];
  let weightedScore = 0;

  for (const check of AUTHORITY_CHECKS) {
    const matches = check.pattern.test(html);
    if (matches) {
      found.push(check.name);
      weightedScore += check.weight;
    } else {
      missing.push(check.name);
    }
  }

  const hasAuthor = found.includes('meta-author') || found.includes('jsonld-author');
  const hasPublisher =
    found.includes('meta-publisher') ||
    found.includes('jsonld-publisher') ||
    found.includes('organization');

  const warnings: string[] = [];
  if (!hasAuthor) {
    warnings.push('Add author name (meta tag or JSON-LD)');
  }
  if (!hasPublisher) {
    warnings.push('Add Publisher/Organization (meta tag or JSON-LD)');
  }

  const finalScore = Math.min(100, weightedScore);

  const data: Record<string, unknown> = {
    checks: {
      hasAuthor,
      hasPublisher,
      hasByline: found.includes('byline'),
      hasAuthorBio: found.includes('authorBio'),
      hasDatePublished: found.includes('datePublished'),
    },
    found,
    missing,
  };

  if (finalScore >= 60) {
    return createSuccessResult(
      `${found.length}/${AUTHORITY_CHECKS.length} authority signals found`,
      finalScore,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  if (finalScore >= 30) {
    return createPartialResult(
      `Limited author authority signals`,
      finalScore,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  return createFailureResult('No author/publisher information found', data);
}
