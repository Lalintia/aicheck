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
 * Weight: 15%
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';

const MIN_CONTENT_LENGTH = 200;
const MIN_TEXT_RATIO = 0.1;

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

const SSR_POSITIVE_INDICATORS = [
  { name: 'pre-rendered content', pattern: /<main[^>]*>[\s\S]{100,}/i },
  { name: 'article content', pattern: /<article[^>]*>[\s\S]{100,}/i },
  { name: 'rendered paragraphs', pattern: /(<p[^>]*>[^<]{20,}<\/p>[\s\S]*?){3,}/i },
  { name: 'meta description', pattern: /<meta[^>]*name=["']description["'][^>]*content=["'][^"']{10,}["']/i },
  { name: 'Next.js SSR', pattern: /__NEXT_DATA__|__next/i },
  { name: 'Nuxt SSR', pattern: /__NUXT__|nuxt/i },
] as const;

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkSSR(html: string): CheckResult {
  const warnings: string[] = [];
  let score = 100;

  // Check 1: Empty body detection (critical)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const textContent = stripHtmlTags(bodyContent);

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
  for (const indicator of SSR_POSITIVE_INDICATORS) {
    if (indicator.pattern.test(html)) {
      ssrIndicators.push(indicator.name);
    }
  }

  // Check 5: Text-to-HTML ratio
  const textRatio = textContent.length / html.length;
  const hasGoodTextRatio = textRatio >= MIN_TEXT_RATIO;

  // Check 6: Title and meta in initial HTML
  const hasTitle = /<title[^>]*>[^<]{2,}<\/title>/i.test(html);
  const hasMetaDescription = /<meta[^>]*name=["']description["'][^>]*content=["'][^"']{10,}["']/i.test(html);

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
