/**
 * AI Visibility Check API Route
 * Separate endpoint that asks GPT-4.1 nano if it knows about a website
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAIVisibility } from '@/lib/checkers/ai-visibility-checker';
import { isSafeUrlWithDns, safeFetch, readWithTimeout } from '@/lib/security';
import { parseCheckRequest } from '@/lib/utils/parse-check-request';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = await parseCheckRequest(request);
    if ('response' in parsed) { return parsed.response; }
    const normalizedUrl = parsed.url;

    if (!(await isSafeUrlWithDns(normalizedUrl))) {
      return NextResponse.json(
        { error: 'Invalid URL. Cannot scan internal addresses.' },
        { status: 400 }
      );
    }

    // Fetch HTML for title/description extraction
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let html = '';
    try {
      const pageResponse = await safeFetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AISearchChecker/1.0)',
          Accept: 'text/html',
        },
        signal: controller.signal,
      });

      if (!pageResponse.ok) {
        pageResponse.body?.cancel().catch(() => { /* already closed */ });
      } else {
        const MAX_HTML_BYTES = 5 * 1024 * 1024;
        const contentLength = pageResponse.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > MAX_HTML_BYTES) {
          pageResponse.body?.cancel().catch(() => { /* already closed */ });
          html = '';
        } else {
          const text = await readWithTimeout(pageResponse, 10000, 'HTML read timeout');
          // Post-read size guard — defends against servers that omit Content-Length (chunked encoding)
          // and stream multi-GB bodies that would OOM before the slice runs
          if (text.length > MAX_HTML_BYTES) {
            html = '';
          } else {
            html = text.slice(0, 100000);
          }
        }
      }
    } catch (err) {
      // Continue with empty HTML — AI check can still work with URL alone
      console.error('[ai-check] HTML fetch failed:', err instanceof Error ? err.message : err);
    } finally {
      clearTimeout(timeoutId);
    }

    // Pass request.signal so client disconnects abort downstream OpenAI/Serper calls
    // (avoids paying API tokens for requests the user has already abandoned)
    const result = await checkAIVisibility(normalizedUrl, html, request.signal);

    return NextResponse.json({
      url: normalizedUrl,
      result,
    });
  } catch (error) {
    console.error('[/api/ai-check] Unhandled error:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: 'AI Visibility check failed. Please try again.' },
      { status: 500 }
    );
  }
}
