/**
 * AI Search Checker API Route
 * Modular implementation using lib/checkers
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CheckResponse } from '@/lib/types/checker';
import {
  checkSchema,
  checkSSR,
  checkRobotsTxt,
  checkHeadingHierarchy,
  checkImageAI,
  checkSemanticHTML,
  checkSitemap,
  checkOpenGraph,
  checkLlmsTxt,
  checkFAQBlocks,
  checkAuthorAuthority,
  checkPageSpeed,
  weights,
  getGrade,
  calculateOverallScore,
  generateRecommendations,
} from '@/lib/checkers';
import { checkRequestSchema } from '@/lib/validations/url';
import { isSafeUrlWithDns, safeFetch } from '@/lib/security';


// API Route Handler
export async function POST(request: NextRequest) {
  try {
    // Reject oversized request bodies before buffering (max ~4KB covers any valid URL)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 4096) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }
    const body = await request.json();
    const parsed = checkRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid URL' },
        { status: 400 }
      );
    }

    // Zod schema already trims, adds https://, and removes trailing slash
    const normalizedUrl = parsed.data.url;

    // SSRF protection — string check + real DNS resolution to block rebinding
    if (!(await isSafeUrlWithDns(normalizedUrl))) {
      return NextResponse.json(
        { error: 'Invalid URL. Cannot scan internal addresses.' },
        { status: 400 }
      );
    }

    // Fetch HTML once with timeout — measure TTFB for pagespeed check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let pageResponse: Response;
    const fetchStart = Date.now();
    try {
      pageResponse = await safeFetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AISearchChecker/1.0)',
          Accept: 'text/html',
        },
        next: { revalidate: 0 },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    const pageTtfb = Date.now() - fetchStart;

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: `Unable to access website (${pageResponse.status})` },
        { status: 400 }
      );
    }

    // Limit response size — check Content-Length header first to avoid buffering large bodies
    const MAX_HTML_SIZE = 10 * 1024 * 1024; // 10MB
    const contentLengthHeader = pageResponse.headers.get('content-length');
    if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_HTML_SIZE) {
      return NextResponse.json(
        { error: 'Website content too large to analyze' },
        { status: 400 }
      );
    }
    let htmlReadTimeoutId: ReturnType<typeof setTimeout> | undefined;
    const html = await Promise.race([
      pageResponse.text(),
      new Promise<never>((_, reject) => {
        htmlReadTimeoutId = setTimeout(() => reject(new Error('HTML body read timeout')), 30000);
      }),
    ]);
    clearTimeout(htmlReadTimeoutId);
    if (html.length > MAX_HTML_SIZE) {
      return NextResponse.json(
        { error: 'Website content too large to analyze' },
        { status: 400 }
      );
    }

    // Run all checks with individual error handling
    // Each check is wrapped to prevent one failure from killing all checks
    const safeCheck = async <T,>(_name: string, checkFn: () => Promise<T> | T, defaultValue: T): Promise<T> => {
      try {
        return await checkFn();
      } catch {
        return defaultValue;
      }
    };

    // Phase 1: fetch robots.txt first — its content is needed by the sitemap checker.
    // Running it separately avoids a second sequential sitemap check after Promise.all.
    const robotsResult = await safeCheck(
      'robotsTxt',
      () => checkRobotsTxt(normalizedUrl),
      { found: false, score: 0, details: 'Check failed', data: {} }
    );
    // Use rawContent (unescaped) so that Sitemap: URLs with & chars parse correctly.
    // Falling back to content (HTML-escaped) would corrupt URLs like ?foo=1&bar=2.
    const robotsContent =
      robotsResult.found && (robotsResult.data?.rawContent ?? robotsResult.data?.content)
        ? String(robotsResult.data.rawContent ?? robotsResult.data.content)
        : undefined;

    // Phase 2: run all remaining checks in parallel, passing robots content to sitemap
    const defaultFail = { found: false, score: 0, details: 'Check failed', data: {} };
    const [
      schemaResult,
      ssrResult,
      headingResult,
      imageResult,
      semanticResult,
      sitemapResult,
      ogResult,
      llmsResult,
      faqResult,
      authorResult,
      speedResult,
    ] = await Promise.all([
      safeCheck('schema', () => checkSchema(normalizedUrl, html), defaultFail),
      safeCheck('ssrCsr', () => checkSSR(html), defaultFail),
      safeCheck('headingHierarchy', () => checkHeadingHierarchy(html), defaultFail),
      safeCheck('imageAI', () => checkImageAI(html), defaultFail),
      safeCheck('semanticHTML', () => checkSemanticHTML(html), defaultFail),
      safeCheck('sitemap', () => checkSitemap(normalizedUrl, robotsContent), defaultFail),
      safeCheck('openGraph', () => checkOpenGraph(html), defaultFail),
      safeCheck('llmsTxt', () => checkLlmsTxt(normalizedUrl), defaultFail),
      safeCheck('faqBlocks', () => checkFAQBlocks(html), defaultFail),
      safeCheck('authorAuthority', () => checkAuthorAuthority(html), defaultFail),
      safeCheck('pageSpeed', () => checkPageSpeed(pageTtfb), defaultFail),
    ]);

    // Remove internal-only rawContent before including in API response
    if (robotsResult.data?.rawContent) {
      delete robotsResult.data.rawContent;
    }

    const checks = {
      schema: schemaResult,
      ssrCsr: ssrResult,
      robotsTxt: robotsResult,
      headingHierarchy: headingResult,
      imageAI: imageResult,
      semanticHTML: semanticResult,
      sitemap: sitemapResult,
      openGraph: ogResult,
      llmsTxt: llmsResult,
      faqBlocks: faqResult,
      authorAuthority: authorResult,
      pageSpeed: speedResult,
    };

    const overallScore = calculateOverallScore(checks, weights);
    const grade = getGrade(overallScore);
    const recommendations = generateRecommendations(checks);

    // Count stats
    const passed = Object.values(checks).filter((c) => c.score >= 70).length;
    const warning = Object.values(checks).filter(
      (c) => c.score >= 50 && c.score < 70
    ).length;
    const failed = Object.values(checks).filter((c) => c.score < 50).length;

    const response: CheckResponse = {
      url: normalizedUrl,
      overallScore,
      grade,
      checks,
      recommendations,
      summary: {
        passed,
        warning,
        failed,
        total: 12,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    // Top-level error — return generic message to client
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
