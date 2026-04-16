import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter, aiRateLimiter, RATE_LIMIT, AI_RATE_LIMIT } from './lib/rate-limiter';

// Allowed origins for cross-origin API requests. Empty Origin header (same-origin
// or non-browser callers like curl) is also allowed.
const ALLOWED_ORIGINS = new Set([
  'https://aicheck.ohmai.me',
  'http://localhost:3000',
  'http://localhost:3001',
]);

function applyCorsHeaders(response: NextResponse, origin: string | null): void {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
}

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const origin = request.headers.get('origin');

  // Remove X-Powered-By header
  response.headers.delete('X-Powered-By');

  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Block cross-origin requests from disallowed origins (CSRF / SSRF-relay protection).
    // Same-origin and non-browser callers send no Origin header — those pass through.
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json(
        { error: 'Cross-origin request not allowed' },
        { status: 403 }
      );
    }

    // CORS preflight — OPTIONS don't consume API quota
    if (request.method === 'OPTIONS') {
      applyCorsHeaders(response, origin);
      return response;
    }

    applyCorsHeaders(response, origin);

    let ip = getClientIp(request);

    // Treat all unknown-IP requests as a single shared bucket with strict limit.
    // This prevents unlimited access if someone bypasses Cloudflare.
    if (ip === 'unknown') {
      ip = '__unknown__';
    }

    // Stricter rate limit for AI-powered endpoint (3 req/min — uses OpenAI API)
    if (request.nextUrl.pathname === '/api/ai-check') {
      const aiResult = aiRateLimiter.check(ip);
      if (!aiResult.allowed) {
        return NextResponse.json(
          {
            error: 'AI check rate limit exceeded. Please wait before trying again.',
            retryAfter: aiResult.retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(aiResult.retryAfter),
            },
          }
        );
      }
      response.headers.set('X-RateLimit-Limit', String(AI_RATE_LIMIT));
      response.headers.set('X-RateLimit-Remaining', String(aiResult.remaining));
      return response;
    }

    const result = rateLimiter.check(ip);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter),
          },
        }
      );
    }

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  }

  return response;
}

/**
 * Get client IP with spoofing protection.
 * Prefers CF-Connecting-IP (Cloudflare) which is set by Cloudflare and cannot be
 * spoofed. Falls back to the last trusted entry of x-forwarded-for — the rightmost
 * IP is appended by the closest trusted proxy and cannot be forged by the client.
 *
 * NOTE: Do NOT trust x-real-ip or x-forwarded-for[0] — both can be freely set by any client.
 */
function getClientIp(request: NextRequest): string {
  // CF-Connecting-IP is authoritative in Cloudflare deployments
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && isValidIpFormat(cfIp)) {
    return cfIp;
  }

  // Use the last (rightmost) entry — added by the closest trusted proxy, not spoofable
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim()).filter(isValidIpFormat);
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }

  return 'unknown';
}

/**
 * Basic IP format validation
 */
function isValidIpFormat(ip: string): boolean {
  // Basic validation - reject empty, localhost, or obviously fake values
  if (!ip || ip === 'unknown') return false;
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') return false;
  
  // IPv6 max length: 45 chars covers full IPv6-mapped IPv4 (e.g. ::ffff:255.255.255.255)
  // Reject oversized strings to prevent map-key bloat attacks
  if (ip.length > 45) return false;

  // Strict IPv4 validation (0-255 per octet) and basic IPv6 format check.
  // Check IPv4 first — CF-Connecting-IP is predominantly IPv4 in practice.
  const ipv4Pattern = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/;
  if (ipv4Pattern.test(ip)) { return true; }

  // IPv6: must contain at least one hex digit between colons (rejects "::::::")
  const ipv6Pattern = /^[0-9a-fA-F]*(?::[0-9a-fA-F]*){2,7}$/;
  if (ipv6Pattern.test(ip) && /[0-9a-fA-F]/.test(ip)) { return true; }

  return false;
}

export const config = {
  matcher: ['/api/:path*', '/'],
};
