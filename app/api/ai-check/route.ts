/**
 * AI Visibility Check API Route
 * Separate endpoint that asks GPT-4.1 nano if it knows about a website
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAIVisibility } from '@/lib/checkers/ai-visibility-checker';
import { checkRequestSchema } from '@/lib/validations/url';
import { isSafeUrlWithDns, safeFetch } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    const cl = contentLength ? parseInt(contentLength, 10) : NaN;
    if (!isNaN(cl) && (cl < 0 || cl > 4096)) {
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

    const normalizedUrl = parsed.data.url;

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

      if (pageResponse.ok) {
        const htmlCl = pageResponse.headers.get('content-length');
        if (htmlCl && parseInt(htmlCl, 10) > 5 * 1024 * 1024) {
          html = '';
        } else {
          let htmlReadTimeout: ReturnType<typeof setTimeout> | undefined;
          const text = await Promise.race([
            pageResponse.text(),
            new Promise<never>((_, reject) => {
              htmlReadTimeout = setTimeout(() => reject(new Error('HTML read timeout')), 10000);
            }),
          ]);
          clearTimeout(htmlReadTimeout);
          html = text.slice(0, 100000);
        }
      }
    } catch {
      // Continue with empty HTML — AI check can still work with URL alone
    } finally {
      clearTimeout(timeoutId);
    }

    const result = await checkAIVisibility(normalizedUrl, html);

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
