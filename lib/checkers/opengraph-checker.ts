/**
 * Open Graph Checker
 * Validates Open Graph meta tags for social sharing
 * Weight: 15%
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';
import { sanitizeContent } from '@/lib/security';

interface OGProperty {
  readonly name: string;
  readonly weight: number;
  readonly required: boolean;
  // Single merged pattern matches meta tag by either property= or name= attribute
  readonly existsPattern: RegExp;
  readonly contentPattern: RegExp;
}

const OG_PROPERTIES: readonly OGProperty[] = [
  { name: 'og:title', weight: 25, required: true,
    existsPattern: /<meta[^>]{0,500}(?:property|name)=["']og:title["'][^>]{0,500}>/i,
    contentPattern: /<meta[^>]{0,500}(?:property|name)=["']og:title["'][^>]{0,500}content=["']([^"']+)["']/i },
  { name: 'og:description', weight: 25, required: true,
    existsPattern: /<meta[^>]{0,500}(?:property|name)=["']og:description["'][^>]{0,500}>/i,
    contentPattern: /<meta[^>]{0,500}(?:property|name)=["']og:description["'][^>]{0,500}content=["']([^"']+)["']/i },
  { name: 'og:image', weight: 25, required: true,
    existsPattern: /<meta[^>]{0,500}(?:property|name)=["']og:image["'][^>]{0,500}>/i,
    contentPattern: /<meta[^>]{0,500}(?:property|name)=["']og:image["'][^>]{0,500}content=["']([^"']+)["']/i },
  { name: 'og:type', weight: 15, required: true,
    existsPattern: /<meta[^>]{0,500}(?:property|name)=["']og:type["'][^>]{0,500}>/i,
    contentPattern: /<meta[^>]{0,500}(?:property|name)=["']og:type["'][^>]{0,500}content=["']([^"']+)["']/i },
  { name: 'og:url', weight: 10, required: false,
    existsPattern: /<meta[^>]{0,500}(?:property|name)=["']og:url["'][^>]{0,500}>/i,
    contentPattern: /<meta[^>]{0,500}(?:property|name)=["']og:url["'][^>]{0,500}content=["']([^"']+)["']/i },
];

const MAX_OG_VALUE_LENGTH = 2048;

export function checkOpenGraph(html: string): CheckResult {
  const found: string[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];
  let weightedScore = 0;

  for (const prop of OG_PROPERTIES) {
    const hasProperty = prop.existsPattern.test(html);

    if (hasProperty) {
      found.push(prop.name);
      weightedScore += prop.weight;
    } else {
      missing.push(prop.name);
      if (prop.required) {
        warnings.push(`Missing ${prop.name}`);
      }
    }
  }

  // Extract values for additional validation using pre-compiled patterns.
  // Length checks run on raw values before sanitization to avoid counting
  // HTML entities (e.g. &amp; = 5 chars) as part of the original content length.
  const rawExtracted: Record<string, string> = {};
  const extracted: Record<string, string> = {};
  for (const prop of OG_PROPERTIES) {
    const match = html.match(prop.contentPattern);
    if (match) {
      rawExtracted[prop.name] = match[1];
      extracted[prop.name] = sanitizeContent(match[1], 500);
    }
  }

  // Validate image URL if present — force https for secure social previews
  if (rawExtracted['og:image']) {
    const img = rawExtracted['og:image'];
    if (img.length > MAX_OG_VALUE_LENGTH) {
      warnings.push('og:image URL too long');
      weightedScore -= 5;
    } else if (!img.startsWith('https://')) {
      warnings.push('og:image URL should use https://');
      weightedScore -= 5;
    }
  }

  // Validate title length (use raw value to avoid entity inflation)
  if (rawExtracted['og:title'] && rawExtracted['og:title'].length > 60) {
    warnings.push('og:title is too long (>60 chars)');
  }

  // Validate description length (use raw value to avoid entity inflation)
  if (rawExtracted['og:description'] && rawExtracted['og:description'].length > 200) {
    warnings.push('og:description is too long (>200 chars)');
  }

  const finalScore = Math.max(0, weightedScore);

  const data: Record<string, unknown> = {
    found,
    missing,
    extracted,
  };

  if (finalScore >= 80) {
    return createSuccessResult(
      `${found.length}/${OG_PROPERTIES.length} Open Graph tags found`,
      finalScore,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  if (finalScore >= 40) {
    return createPartialResult(
      `Partial Open Graph: ${found.length}/${OG_PROPERTIES.length} tags`,
      finalScore,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  return createFailureResult(
    'Open Graph meta tags not found or incomplete',
    data
  );
}
