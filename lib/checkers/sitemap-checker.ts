/**
 * Sitemap Checker
 * Validates sitemap.xml existence and content
 * Weight: 10%
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';
import { isSafeUrlWithDns, safeFetch, sanitizeContent } from '@/lib/security';

const MAX_SITEMAP_SIZE = 5 * 1024 * 1024; // 5MB

interface FoundSitemap {
  readonly url: string;
  readonly content: string;
  readonly urls: number;
  readonly hasUrlset: boolean;
  readonly hasSitemapIndex: boolean;
  readonly hasLastmod: boolean;
  readonly hasChangefreq: boolean;
  readonly hasPriority: boolean;
}

async function trySitemapUrl(sitemapUrl: string): Promise<FoundSitemap> {
  if (!(await isSafeUrlWithDns(sitemapUrl))) {
    throw new Error(`${sitemapUrl}: URL not allowed`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await safeFetch(sitemapUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AISearchChecker/1.0)',
        Accept: 'application/xml,text/xml',
      },
      next: { revalidate: 0 },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_SITEMAP_SIZE) {
    throw new Error('Sitemap too large');
  }

  let bodyReadTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let rawContent: string;
  try {
    rawContent = await Promise.race([
      response.text(),
      new Promise<never>((_, reject) => {
        bodyReadTimeoutId = setTimeout(() => reject(new Error('sitemap body read timeout')), 10000);
      }),
    ]);
  } finally {
    clearTimeout(bodyReadTimeoutId);
  }
  if (rawContent.length > MAX_SITEMAP_SIZE) {
    throw new Error('Sitemap too large');
  }

  // Compute flags immediately — rawContent is never stored beyond this scope
  const hasUrlset = rawContent.includes('<urlset');
  const hasSitemapIndex = rawContent.includes('<sitemapindex');

  if (!hasUrlset && !hasSitemapIndex) {
    throw new Error('Not a valid sitemap format');
  }

  const urlMatches = rawContent.match(/<url>/g);

  return {
    url: sitemapUrl,
    content: sanitizeContent(rawContent, 500),
    urls: urlMatches ? urlMatches.length : 0,
    hasUrlset,
    hasSitemapIndex,
    hasLastmod: rawContent.includes('<lastmod>'),
    hasChangefreq: rawContent.includes('<changefreq>'),
    hasPriority: rawContent.includes('<priority>'),
  };
}

export async function checkSitemap(
  url: string,
  robotsContent?: string
): Promise<CheckResult> {
  try {
    const urlObj = new URL(url);
    let sitemapUrls: string[] = [];

    // First, try to find sitemap from robots.txt
    // Only accept URLs on the same origin to prevent SSRF via robots.txt content
    if (robotsContent) {
      const sitemapMatches = robotsContent.match(/Sitemap:\s*(.+)/gi);
      if (sitemapMatches) {
        sitemapUrls = sitemapMatches
          .map((m) => {
            const match = m.match(/Sitemap:\s*(.+)/i);
            return match ? match[1].trim() : '';
          })
          .filter((sitemapUrl) => {
            if (!sitemapUrl) return false;
            try {
              return new URL(sitemapUrl).host === urlObj.host;
            } catch {
              return false;
            }
          });
      }
    }

    // If no sitemap found in robots.txt, try common locations
    if (sitemapUrls.length === 0) {
      sitemapUrls = [
        `${urlObj.protocol}//${urlObj.host}/sitemap.xml`,
        `${urlObj.protocol}//${urlObj.host}/sitemap_index.xml`,
      ];
    }

    let foundSitemap: FoundSitemap;
    try {
      // Race URLs in parallel (cap at 5 to limit outbound connections)
      foundSitemap = await Promise.any(sitemapUrls.slice(0, 5).map(trySitemapUrl));
    } catch (err) {
      const errors =
        err instanceof AggregateError
          ? err.errors.map((e: unknown) => (e instanceof Error ? e.message : 'Fetch error'))
          : ['Unable to fetch sitemap'];
      return createFailureResult('Sitemap.xml not found', {
        checkedUrls: sitemapUrls,
        errors,
      });
    }

    let score = 100;
    if (!foundSitemap.urls) score -= 30;
    if (!foundSitemap.hasLastmod) score -= 10;
    if (!foundSitemap.hasChangefreq) score -= 10;
    if (!foundSitemap.hasPriority) score -= 5;

    score = Math.max(0, score);

    const data: Record<string, unknown> = {
      url: foundSitemap.url,
      urls: foundSitemap.urls,
      hasUrlset: foundSitemap.hasUrlset,
      hasSitemapIndex: foundSitemap.hasSitemapIndex,
      hasLastmod: foundSitemap.hasLastmod,
      hasChangefreq: foundSitemap.hasChangefreq,
      hasPriority: foundSitemap.hasPriority,
      type: foundSitemap.hasSitemapIndex ? 'sitemapindex' : 'urlset',
    };

    if (score >= 80) {
      return createSuccessResult(
        `Sitemap found with ${foundSitemap.urls} URLs`,
        score,
        data
      );
    }

    return createPartialResult(
      'Sitemap found but missing some optional fields',
      score,
      data
    );
  } catch (error) {
    return createFailureResult('Unable to check sitemap', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
