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

const AUTHORITY_CHECKS: readonly AuthorityCheck[] = [
  {
    name: 'author',
    pattern: /<meta[^>]*name=["']author["'][^>]*>/i,
    weight: 25,
  },
  {
    name: 'publisher',
    pattern: /<meta[^>]*name=["']publisher["'][^>]*>/i,
    weight: 25,
  },
  {
    name: 'organization',
    pattern: /"@type":\s*"Organization"/i,
    weight: 25,
  },
  {
    name: 'byline',
    pattern: /class=["'][^"']{0,100}(?:byline|author)["']/i,
    weight: 15,
  },
  {
    name: 'authorBio',
    pattern: /(ประวัติ|bio|about.*author)/i,
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

  const warnings: string[] = [];
  if (!found.includes('author')) {
    warnings.push('Add author name');
  }
  if (!found.includes('publisher') && !found.includes('organization')) {
    warnings.push('Add Publisher/Organization');
  }

  const finalScore = Math.min(100, weightedScore);

  const data: Record<string, unknown> = {
    checks: {
      hasAuthor: found.includes('author'),
      hasPublisher: found.includes('publisher') || found.includes('organization'),
      hasByline: found.includes('byline'),
      hasAuthorBio: found.includes('authorBio'),
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
