/**
 * llms.txt Checker
 * Validates llms.txt file existence per Answer.AI standard
 * Weight: see `weights.llmsTxt` in `./base.ts` (single source of truth)
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';
import { isSafeUrlWithDns, safeFetch, sanitizeContent, readWithTimeout } from '@/lib/security';

const MAX_LLMS_SIZE = 512 * 1024; // 512KB

export async function checkLlmsTxt(url: string): Promise<CheckResult> {
  try {
    const urlObj = new URL(url);
    const llmsUrl = `${urlObj.protocol}//${urlObj.host}/llms.txt`;

    if (!(await isSafeUrlWithDns(llmsUrl))) {
      return createFailureResult('llms.txt URL is not allowed', { url: llmsUrl });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await safeFetch(llmsUrl, {
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
        return createFailureResult('llms.txt not found (HTTP 404)', {
          url: llmsUrl,
          status: response.status,
        });
      }
      return createFailureResult(`llms.txt returned HTTP ${response.status}`, {
        url: llmsUrl,
        status: response.status,
      });
    }

    // Size guard before buffering body
    const contentLengthHeader = response.headers.get('content-length');
    if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_LLMS_SIZE) {
      response.body?.cancel().catch(() => { /* already closed */ });
      return createFailureResult('llms.txt too large to analyze', { url: llmsUrl });
    }
    const content = await readWithTimeout(response, 10000, 'llms.txt body read timeout');
    if (content.length > MAX_LLMS_SIZE) {
      return createFailureResult('llms.txt too large to analyze', { url: llmsUrl });
    }

    // Detect soft 404 — some servers return an HTML page with HTTP 200
    // Check Content-Type header first, then sniff content
    const contentType = response.headers.get('content-type') ?? '';
    const isHtml = contentType.includes('text/html') ||
      /^\s*<!(?:DOCTYPE\s+html|html)/i.test(content.slice(0, 100));
    if (isHtml) {
      return createFailureResult('llms.txt not found (server returned HTML page)', {
        url: llmsUrl,
        status: response.status,
      });
    }

    // Basic validation of llms.txt format per Answer.AI standard
    const hasTitle = /^#\s+/m.test(content);
    const hasSections = /##\s+/m.test(content);
    const hasMarkdownLinks = /\[.+\]\(.+\)/.test(content);

    // Check for key sections
    const sections = {
      overview: /^#\s+Overview/im.test(content) || content.toLowerCase().includes('overview'),
      sections: content.match(/^##\s+(.+)$/gm)?.length || 0,
    };

    const data: Record<string, unknown> = {
      url: llmsUrl,
      contentLength: content.length,
      hasTitle,
      hasSections,
      hasMarkdownLinks,
      sections,
      preview: sanitizeContent(content, 500),
    };

    // Score based on content quality
    let score = 100;
    if (!hasTitle) score -= 20;
    if (!hasSections) score -= 20;
    if (!hasMarkdownLinks) score -= 10;
    if (content.length < 100) score -= 20;

    score = Math.max(0, score);

    if (score >= 80) {
      return createSuccessResult('llms.txt found and properly formatted', score, data);
    }

    return createPartialResult('llms.txt found but could be improved', score, data);
  } catch (error) {
    return createFailureResult('Unable to check llms.txt', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
