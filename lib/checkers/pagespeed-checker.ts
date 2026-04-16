/**
 * Page Speed Checker
 * Basic load time measurement
 * Weight: see `weights.pageSpeed` in `./base.ts` (single source of truth)
 */

import type { CheckResult } from './base';
import { createSuccessResult } from './base';

interface SpeedThreshold {
  readonly max: number;
  readonly score: number;
  readonly label: string;
}

// Thresholds calibrated for server-to-server TTFB (Singapore EC2 → target).
// Well-CDN'd sites typically respond in 100–400ms; 1s+ indicates slow origin.
const SPEED_THRESHOLDS: readonly SpeedThreshold[] = [
  { max: 300,  score: 100, label: 'excellent' },
  { max: 600,  score: 85,  label: 'good' },
  { max: 1000, score: 70,  label: 'fair' },
  { max: 2000, score: 50,  label: 'slow' },
];

/**
 * Evaluates page speed using the TTFB measured during the initial HTML fetch
 * in the API route. This avoids a duplicate HTTP request to the target site.
 */
export function checkPageSpeed(ttfb: number): CheckResult {
  // Determine score based on response time
  let score = 20;
  let label = 'very slow';
  for (const threshold of SPEED_THRESHOLDS) {
    if (ttfb < threshold.max) {
      score = threshold.score;
      label = threshold.label;
      break;
    }
  }

  const warnings: string[] = [];
  if (ttfb > 3000) {
    warnings.push('Page is slow, needs optimization');
  }

  const data: Record<string, unknown> = {
    loadTime: ttfb,
    label,
    note: 'Measured as server response time (TTFB). Use Google PSI API for full load metrics.',
  };

  return createSuccessResult(
    `Server responded in ${ttfb}ms (${label})`,
    score,
    data,
    warnings.length > 0 ? warnings : undefined
  );
}
