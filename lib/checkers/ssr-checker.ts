/**
 * SSR/CSR Detection Checker
 * Validates whether the website renders content server-side (SSR)
 * or relies on client-side JavaScript rendering (CSR)
 *
 * Why this matters for AI Search:
 * - AI crawlers (Googlebot, GPTBot, PerplexityBot) have limited JavaScript execution
 * - CSR-heavy sites may appear as blank pages to AI crawlers
 * - Google recommends SSR/SSG for better crawlability
 *
 * References:
 * - Google: "Understand the JavaScript SEO basics"
 *   https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
 * - Web.dev: "Rendering on the Web"
 *   https://web.dev/articles/rendering-on-the-web
 * - OpenAI GPTBot documentation
 *   https://platform.openai.com/docs/bots/gptbot
 *
 * Weight: see `weights.ssrCsr` in `./base.ts` (single source of truth)
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';

const MIN_CONTENT_LENGTH = 200;
const MIN_TEXT_RATIO = 0.1;
// Cap body slice scanned by stripHtmlTags — 200KB is more than enough to detect SSR
// (the check just needs to know if substantial text exists in the initial HTML)
const MAX_BODY_SCAN_BYTES = 200_000;
// Threshold for considering rendered paragraphs as evidence of SSR
const RENDERED_PARAGRAPH_THRESHOLD = 3;

const SPA_FRAMEWORK_PATTERNS = [
  { name: 'React SPA', pattern: /<div\s+id=["'](?:root|app|__next)["']\s*>\s*<\/div>/i },
  { name: 'Vue SPA', pattern: /<div\s+id=["'](?:app|__nuxt)["']\s*>\s*<\/div>/i },
  { name: 'Angular', pattern: /<app-root[^>]*>\s*<\/app-root>/i },
] as const;

const JS_HEAVY_INDICATORS = [
  { name: 'bundle.js', pattern: /src=["'][^"']*bundle[^"']*\.js["']/i },
  { name: 'chunk loading', pattern: /src=["'][^"']*chunk[^"']*\.js["']/i },
  { name: 'webpack runtime', pattern: /webpackJsonp|__webpack_require__/i },
] as const;

// Match meta description in both attribute orders (name-first or content-first)
// since HTML allows attributes in any order.
const META_DESCRIPTION_NAME_FIRST = /<meta[^>]*name=["']description["'][^>]*content=["'][^"']{10,}["']/i;
const META_DESCRIPTION_CONTENT_FIRST = /<meta[^>]*content=["'][^"']{10,}["'][^>]*name=["']description["']/i;

const SSR_POSITIVE_INDICATORS = [
  { name: 'meta description', pattern: META_DESCRIPTION_NAME_FIRST },
  { name: 'meta description (alt order)', pattern: META_DESCRIPTION_CONTENT_FIRST },
  { name: 'Next.js SSR', pattern: /__NEXT_DATA__|__next/i },
  { name: 'Nuxt SSR', pattern: /__NUXT__|nuxt/i },
] as const;

/**
 * Check if a tag has substantial content without using unbounded regex.
 * Uses indexOf for O(n) scan without backtracking risk.
 */
function hasSubstantialContent(html: string, tagName: string, minLength: number): boolean {
  const openTag = `<${tagName}`;
  const idx = html.toLowerCase().indexOf(openTag);
  if (idx === -1) { return false; }
  const closeIdx = html.indexOf('>', idx);
  if (closeIdx === -1) { return false; }
  const contentStart = closeIdx + 1;
  const remaining = html.length - contentStart;
  return remaining >= minLength;
}

/**
 * Strip script/style blocks and HTML tags safely without regex backtracking.
 * Uses indexOf-based extraction to avoid ReDoS on malformed HTML.
 *
 * Performance: lowercases the input ONCE per tag (not per-iteration) to avoid
 * O(n²) memory blowup on multi-MB pages. Each tag pass also re-lowercases the
 * joined output once at the end of its loop.
 */
function stripHtmlTags(html: string): string {
  let result = html;
  for (const tag of ['script', 'style']) {
    const parts: string[] = [];
    let pos = 0;
    const lowerResult = result.toLowerCase();
    const openMarker = `<${tag}`;
    const closeMarker = `</${tag}>`;
    while (pos < lowerResult.length) {
      const openIdx = lowerResult.indexOf(openMarker, pos);
      if (openIdx === -1) {
        parts.push(result.slice(pos));
        break;
      }
      parts.push(result.slice(pos, openIdx));
      const closeIdx = lowerResult.indexOf(closeMarker, openIdx);
      if (closeIdx === -1) {
        break;
      }
      pos = closeIdx + closeMarker.length;
    }
    result = parts.join('');
  }
  return result
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkSSR(html: string): CheckResult {
  const warnings: string[] = [];
  let score = 100;

  // Check 1: Empty body detection (critical)
  // Use indexOf instead of regex to avoid ReDoS on large HTML
  // Lowercase once and reuse — avoids two full-string allocations on multi-MB pages
  const lowerHtml = html.toLowerCase();
  const bodyStartIdx = lowerHtml.indexOf('<body');
  const bodyTagEnd = bodyStartIdx !== -1 ? html.indexOf('>', bodyStartIdx) : -1;
  const bodyCloseIdx = lowerHtml.lastIndexOf('</body>');
  const bodyContent = (bodyTagEnd !== -1 && bodyCloseIdx > bodyTagEnd)
    ? html.slice(bodyTagEnd + 1, bodyCloseIdx)
    : html;
  // Cap body sample before stripping — SSR detection only needs to know if
  // substantial text exists in the initial HTML, not process all of it
  const bodySample = bodyContent.length > MAX_BODY_SCAN_BYTES
    ? bodyContent.slice(0, MAX_BODY_SCAN_BYTES)
    : bodyContent;
  const textContent = stripHtmlTags(bodySample);

  if (textContent.length < MIN_CONTENT_LENGTH) {
    return createFailureResult(
      'Very little text content in initial HTML — AI crawlers may see a blank page',
      {
        textLength: textContent.length,
        minRequired: MIN_CONTENT_LENGTH,
        issue: 'empty_body',
      }
    );
  }

  // Check 2: SPA empty container detection (critical)
  const detectedSPA: string[] = [];
  for (const framework of SPA_FRAMEWORK_PATTERNS) {
    if (framework.pattern.test(html)) {
      detectedSPA.push(framework.name);
    }
  }

  if (detectedSPA.length > 0 && textContent.length < 500) {
    return createFailureResult(
      `Detected ${detectedSPA.join(', ')} with empty container — content loads via JavaScript only`,
      {
        detectedFrameworks: detectedSPA,
        textLength: textContent.length,
        issue: 'spa_empty_container',
      }
    );
  }

  // Check 3: JS-heavy indicators
  const jsIndicators: string[] = [];
  for (const indicator of JS_HEAVY_INDICATORS) {
    if (indicator.pattern.test(html)) {
      jsIndicators.push(indicator.name);
    }
  }

  // Check 4: SSR positive indicators
  const ssrIndicators: string[] = [];
  if (hasSubstantialContent(html, 'main', 100)) {
    ssrIndicators.push('pre-rendered content');
  }
  if (hasSubstantialContent(html, 'article', 100)) {
    ssrIndicators.push('article content');
  }
  for (const indicator of SSR_POSITIVE_INDICATORS) {
    if (indicator.pattern.test(html)) {
      ssrIndicators.push(indicator.name);
    }
  }
  // Count rendered paragraphs with early exit — only need to know if >= threshold,
  // so stop once threshold is hit instead of allocating an array of every match
  const paragraphRegex = /<p[^>]*>[^<]{20,}<\/p>/gi;
  let renderedParagraphCount = 0;
  let pMatch: RegExpExecArray | null;
  while (renderedParagraphCount < RENDERED_PARAGRAPH_THRESHOLD && (pMatch = paragraphRegex.exec(html)) !== null) {
    renderedParagraphCount++;
    // Prevent infinite loop on zero-length matches (defensive — pattern requires {20,})
    if (pMatch[0].length === 0) { paragraphRegex.lastIndex++; }
  }
  if (renderedParagraphCount >= RENDERED_PARAGRAPH_THRESHOLD) {
    ssrIndicators.push('rendered paragraphs');
  }

  // Check 5: Text-to-HTML ratio
  const textRatio = textContent.length / html.length;
  const hasGoodTextRatio = textRatio >= MIN_TEXT_RATIO;

  // Check 6: Title and meta in initial HTML
  const hasTitle = /<title[^>]*>[^<]{2,}<\/title>/i.test(html);
  const hasMetaDescription = META_DESCRIPTION_NAME_FIRST.test(html) || META_DESCRIPTION_CONTENT_FIRST.test(html);

  // Scoring
  if (detectedSPA.length > 0 && ssrIndicators.length === 0) {
    score -= 30;
    warnings.push(`SPA framework detected (${detectedSPA.join(', ')}) — ensure server-side rendering is enabled`);
  }

  if (jsIndicators.length >= 2 && ssrIndicators.length === 0) {
    score -= 20;
    warnings.push('Heavy JavaScript bundle detected — AI crawlers may not execute JS');
  }

  if (!hasGoodTextRatio) {
    score -= 15;
    warnings.push(`Low text-to-HTML ratio (${(textRatio * 100).toFixed(1)}%) — content may be JS-rendered`);
  }

  if (!hasTitle) {
    score -= 10;
    warnings.push('No <title> tag found in initial HTML');
  }

  if (!hasMetaDescription) {
    score -= 10;
    warnings.push('No meta description in initial HTML');
  }

  // Bonus for SSR indicators
  if (ssrIndicators.length >= 3) {
    score = Math.min(100, score + 10);
  }

  score = Math.max(0, Math.min(100, score));

  const data: Record<string, unknown> = {
    textContentLength: textContent.length,
    textToHtmlRatio: Math.round(textRatio * 1000) / 10,
    hasTitle,
    hasMetaDescription,
    detectedSPA: detectedSPA.length > 0 ? detectedSPA : undefined,
    jsHeavyIndicators: jsIndicators.length > 0 ? jsIndicators : undefined,
    ssrIndicators: ssrIndicators.length > 0 ? ssrIndicators : undefined,
  };

  if (score >= 80) {
    return createSuccessResult(
      `Content is server-rendered — AI crawlers can read this page (${textContent.length} chars of text)`,
      score,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  if (score >= 50) {
    return createPartialResult(
      'Content is partially server-rendered — some content may not be visible to AI crawlers',
      score,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  return createPartialResult(
    'Content is heavily JavaScript-dependent — AI crawlers may not see most content',
    score,
    data,
    warnings.length > 0 ? warnings : undefined
  );
}
