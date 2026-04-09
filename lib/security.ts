/**
 * Security utilities for SSRF protection and input validation
 */

import { lookup } from 'dns/promises';

/**
 * Validates if a URL is safe to fetch (SSRF protection)
 * Checks for internal IPs, private ranges, and various encoding bypasses
 */
export function isSafeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // Only allow http/https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    
    // Handle IPv6 literals
    if (hostname.startsWith('[')) {
      const ipv6Literal = hostname.slice(1, -1);
      if (ipv6Literal === '::1' || ipv6Literal === '0:0:0:0:0:0:0:1') return false;
      if (ipv6Literal.toLowerCase().startsWith('::ffff:')) {
        const ipv4Part = ipv6Literal.slice(7);
        if (ipv4Part === '127.0.0.1') return false;
        // Check if mapped IPv4 is private
        if (isPrivateIPv4(ipv4Part)) return false;
      }
      if (/^f[cd][0-9a-f]{2}:/i.test(ipv6Literal)) return false; // fc00::/7 ULA (fc and fd)
      if (/^fe[89ab][0-9a-f]:/i.test(ipv6Literal)) return false; // fe80::/10 link-local
      if (/^2001:/i.test(ipv6Literal)) return false; // Teredo tunnelling
      if (/^2002:(?:7f|0a|c0a8|ac1)/i.test(ipv6Literal)) return false; // 6to4 mapping private IPv4
      if (ipv6Literal === '::') return false; // unspecified address
    }
    
    // Check for IPv4 addresses (including encoded forms)
    if (isPrivateIPv4(hostname)) return false;
    
    // Block single number IPs (decimal encoded)
    if (/^\d+$/.test(hostname)) {
      const num = parseInt(hostname, 10);
      if (!isNaN(num)) {
        const dotted = `${(num >>> 24) & 0xFF}.${(num >>> 16) & 0xFF}.${(num >>> 8) & 0xFF}.${num & 0xFF}`;
        if (isPrivateIPv4(dotted)) return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an IPv4 address (or hostname that looks like IPv4) is private/internal
 */
function isPrivateIPv4(hostname: string): boolean {
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4Match) return false;
  
  const parts = ipv4Match.slice(1).map(p => {
    // Handle octal (0-prefix) and hex (0x-prefix)
    if (p.startsWith('0x') || p.startsWith('0X')) {
      return parseInt(p, 16);
    } else if (p.length > 1 && p.startsWith('0')) {
      return parseInt(p, 8);
    }
    return parseInt(p, 10);
  });
  
  // Check for invalid octets
  if (parts.some(p => isNaN(p) || p < 0 || p > 255)) return true;
  
  const [a, b, c] = parts;
  
  // Private IP ranges
  if (a === 10) return true;                          // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
  if (a === 192 && b === 168) return true;            // 192.168.0.0/16
  if (a === 127) return true;                         // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true;            // 169.254.0.0/16 (link-local)
  if (a === 0) return true;                           // 0.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true;  // 100.64.0.0/10 (CGNAT)
  if (a === 192 && b === 0 && c === 0) return true;   // 192.0.0.0/24
  if (a === 192 && b === 88 && c === 99) return true; // 192.88.99.0/24 (6to4)
  if (a === 198 && b >= 18 && b <= 19) return true;   // 198.18.0.0/15 (benchmark)
  if (a >= 224 && a <= 239) return true;              // 224.0.0.0/4 (multicast)
  if (a >= 240) return true;                          // 240.0.0.0/4 (reserved/Class E)

  return false;
}

/**
 * Sanitize external content for safe output
 * Removes potentially dangerous characters and limits length
 */
export function sanitizeContent(content: string, maxLength: number = 1000): string {
  if (!content) return '';
  
  // Limit length first
  let sanitized = content.slice(0, maxLength);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Replace potentially dangerous control characters
  sanitized = sanitized.replace(/[\x01-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, '');
  
  // Escape HTML entities to prevent XSS if rendered in HTML context
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized;
}

/**
 * Validates that a hostname resolves to a safe IP address.
 * Performs an actual DNS lookup to prevent DNS rebinding attacks.
 */
/**
 * Check if an IPv6 address is private/internal
 */
function isPrivateIPv6(address: string): boolean {
  const lower = address.toLowerCase();
  if (lower === '::1' || lower === '::') { return true; }
  if (lower.startsWith('fc') || lower.startsWith('fd')) { return true; } // fc00::/7 ULA
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) { return true; } // fe80::/10 link-local
  if (lower.startsWith('::ffff:')) {
    const ipv4Part = lower.slice(7);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ipv4Part)) { return isPrivateIPv4(ipv4Part); }
    return true; // hex-encoded IPv4-mapped — block conservatively
  }
  if (lower.startsWith('64:ff9b:')) { return true; } // NAT64
  if (lower.startsWith('2001:db8:')) { return true; } // documentation range
  if (/^2001:0{0,4}:/.test(lower)) { return true; } // 2001:0000::/32 Teredo tunneling
  if (lower.startsWith('100::')) { return true; } // discard prefix
  return false;
}

export async function validateDnsResolution(hostname: string): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const dnsPromise = lookup(hostname, { all: true });
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('DNS timeout')), 3000);
    });
    const addresses = await Promise.race([dnsPromise, timeoutPromise]);
    for (const entry of addresses) {
      if (entry.family === 4 && isPrivateIPv4(entry.address)) { return false; }
      if (entry.family === 6 && isPrivateIPv6(entry.address)) { return false; }
    }
    return addresses.length > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Combines string-based SSRF checks with a live DNS resolution check.
 * Use this in place of the synchronous isSafeUrl() when making outbound requests.
 */
export async function isSafeUrlWithDns(url: string): Promise<boolean> {
  if (!isSafeUrl(url)) return false;
  try {
    const { hostname } = new URL(url);
    return await validateDnsResolution(hostname);
  } catch {
    return false;
  }
}

/**
 * Fetch wrapper with SSRF-safe redirect handling.
 * Follows at most one redirect, re-validating the Location URL before following.
 * Prevents SSRF via 301/302 redirect to internal addresses.
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, { ...options, redirect: 'manual' });

  // Not a redirect — return directly
  if (response.status < 300 || response.status >= 400) {
    return response;
  }

  // For 3xx, validate the Location before following
  const location = response.headers.get('location');
  if (!location) return response;

  // Resolve relative redirect against the original URL
  let resolvedUrl: string;
  try {
    resolvedUrl = new URL(location, url).href;
  } catch {
    throw new Error('Invalid redirect location');
  }

  // Block redirects to unsafe (internal/private) addresses — DNS check prevents rebinding
  if (!(await isSafeUrlWithDns(resolvedUrl))) {
    throw new Error('Redirect to unsafe URL blocked');
  }

  // Abort if the caller's signal already fired during DNS validation
  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Follow once — never follow subsequent redirects
  return fetch(resolvedUrl, { ...options, redirect: 'error' });
}
