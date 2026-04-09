import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter, aiRateLimiter, RATE_LIMIT } from './lib/rate-limiter';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Remove X-Powered-By header
  response.headers.delete('X-Powered-By');

  // Only apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip rate limiting for CORS preflight — OPTIONS don't consume API quota
    if (request.method === 'OPTIONS') {
      return response;
    }

    const ip = getClientIp(request);

    // Skip per-IP rate limiting when the client IP cannot be determined.
    // In this case, rely on infrastructure-level rate limiting (Nginx/Cloudflare).
    // Keying on 'unknown' would unfairly throttle all such clients with one shared bucket.
    if (ip === 'unknown') {
      return response;
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
      response.headers.set('X-RateLimit-Limit', '3');
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

  const ipv6Pattern = /^[0-9a-fA-F:]+$/;
  if (ipv6Pattern.test(ip)) {
    const colonCount = (ip.match(/:/g) ?? []).length;
    return colonCount >= 2 && colonCount <= 8;
  }

  return false;
}

export const config = {
  matcher: ['/api/:path*', '/'],
};
