/**
 * robots.txt Checker
 * Validates robots.txt configuration for AI crawlers
 * Weight: 15%
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';
import { isSafeUrlWithDns, safeFetch, sanitizeContent } from '@/lib/security';

const MAX_ROBOTS_SIZE = 1 * 1024 * 1024; // 1MB

const AI_BOTS = [
  { name: 'GPTBot', critical: true },
  { name: 'ChatGPT-User', critical: true },
  { name: 'Claude-Web', critical: false },
  { name: 'CCBot', critical: false },
  { name: 'PerplexityBot', critical: false },
  { name: 'Google-Extended', critical: false },
] as const;

export async function checkRobotsTxt(url: string): Promise<CheckResult> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    if (!(await isSafeUrlWithDns(robotsUrl))) {
      return createFailureResult('robots.txt URL is not allowed', { url: robotsUrl });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await safeFetch(robotsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AISearchChecker/1.0)',
          Accept: 'text/plain',
        },
        next: { revalidate: 0 },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      response.body?.cancel().catch(() => { /* already closed */ });
      if (response.status === 404) {
        return createFailureResult('robots.txt not found (HTTP 404)', {
          status: response.status,
          url: robotsUrl,
        });
      }
      return createFailureResult(`robots.txt returned HTTP ${response.status}`, {
        status: response.status,
        url: robotsUrl,
      });
    }

    // Size guard before buffering body
    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_ROBOTS_SIZE) {
      response.body?.cancel().catch(() => { /* already closed */ });
      return createFailureResult('robots.txt too large to analyze', { url: robotsUrl });
    }
    let bodyReadTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let content: string;
    try {
      content = await Promise.race([
        response.text(),
        new Promise<never>((_, reject) => {
          bodyReadTimeoutId = setTimeout(() => reject(new Error('robots.txt body read timeout')), 10000);
        }),
      ]);
    } finally {
      clearTimeout(bodyReadTimeoutId);
    }
    if (content.length > MAX_ROBOTS_SIZE) {
      return createFailureResult('robots.txt too large to analyze', { url: robotsUrl });
    }

    // Sanitize content for safe output
    const safeContent = sanitizeContent(content, 1000);

    // Check for basic content
    const hasUserAgent = /User-agent:/i.test(content);
    const hasAllow = /Allow:/i.test(content);
    const hasDisallow = /Disallow:/i.test(content);
    const hasSitemap = /Sitemap:/i.test(content);

    if (!hasUserAgent) {
      return createFailureResult('robots.txt exists but missing User-agent', {
        content: safeContent.slice(0, 500),
      });
    }

    // Single-pass parser: O(lines + bots) instead of O(lines × bots)
    const botNames = new Set<string>(AI_BOTS.map((b) => b.name));
    const botBlockedMap = new Map<string, boolean>();
    for (const bot of AI_BOTS) botBlockedMap.set(bot.name, false);
    let currentSection: string | null = null;
    let isBlockedGlobally = false;

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const userAgentMatch = trimmed.match(/^User-agent:\s*(.+)$/i);
      if (userAgentMatch) {
        currentSection = userAgentMatch[1].trim();
        continue;
      }

      if (currentSection && trimmed.match(/^Disallow:\s*\/?\s*$/i)) {
        if (currentSection === '*') {
          isBlockedGlobally = true;
        } else if (botNames.has(currentSection)) {
          botBlockedMap.set(currentSection, true);
        }
      }
    }

    const blockedBots: string[] = [];
    const allowedBots: string[] = [];
    const warnings: string[] = [];

    for (const bot of AI_BOTS) {
      if (isBlockedGlobally || botBlockedMap.get(bot.name)) {
        blockedBots.push(bot.name);
        if (bot.critical) warnings.push(`${bot.name} may be blocked from crawling`);
      } else {
        allowedBots.push(bot.name);
      }
    }

    // Calculate score
    let score = 100;
    if (blockedBots.length > 0) {
      const criticalBlocked = AI_BOTS.filter(
        (b) => b.critical && blockedBots.includes(b.name)
      ).length;
      score -= criticalBlocked * 20;
      score -= (blockedBots.length - criticalBlocked) * 5;
    }

    // Check sitemap reference
    if (!hasSitemap) {
      warnings.push('Sitemap not referenced in robots.txt');
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 80) {
      return createSuccessResult(
        `robots.txt configured correctly (${blockedBots.length} bots blocked)`,
        score,
        {
          hasUserAgent,
          hasAllow,
          hasDisallow,
          hasSitemap,
          blockedBots,
          allowedBots,
          content: safeContent,
          // rawContent: used internally by sitemap-checker to extract Sitemap: URLs
          // Must NOT be HTML-escaped so that URLs with & characters parse correctly.
          // Keep enough content to preserve Sitemap: URLs declared after first 1KB
          rawContent: content.slice(0, 10000),
        },
        warnings.length > 0 ? warnings : undefined
      );
    }

    return createPartialResult(
      `robots.txt exists but ${blockedBots.length} AI bots may be blocked`,
      score,
      {
        hasUserAgent,
        hasAllow,
        hasDisallow,
        hasSitemap,
        blockedBots,
        allowedBots,
        content: safeContent,
        // rawContent: used internally by sitemap-checker to extract Sitemap: URLs
        // Keep 10KB so Sitemap: URLs declared late in the file are preserved
        rawContent: content.slice(0, 10000),
      },
      warnings.length > 0 ? warnings : undefined
    );
  } catch (error) {
    return createFailureResult('Unable to check robots.txt', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
