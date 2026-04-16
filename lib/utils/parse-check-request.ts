import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRequestSchema } from '@/lib/validations/url';

const MAX_REQUEST_BODY_BYTES = 4096;

/**
 * Parses and validates the request body for a URL check endpoint.
 * Both `/api/check` and `/api/ai-check` share the same { url } request shape,
 * the same body-size cap, and the same Zod schema — extract once so changes
 * stay in sync across endpoints.
 *
 * Returns either the validated `url` string or a `NextResponse` to send
 * directly back to the client.
 */
export async function parseCheckRequest(
  request: NextRequest
): Promise<{ url: string } | { response: NextResponse }> {
  // Hard body size cap — reads actual bytes, not the Content-Length header (which can be omitted)
  const rawBody = await request.text();
  if (rawBody.length > MAX_REQUEST_BODY_BYTES) {
    return { response: NextResponse.json({ error: 'Request body too large' }, { status: 413 }) };
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { response: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) };
  }

  const parsed = checkRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid URL' },
        { status: 400 }
      ),
    };
  }

  // Zod schema already trims, adds https://, and removes trailing slash
  return { url: parsed.data.url };
}
