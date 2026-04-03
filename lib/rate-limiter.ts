/**
 * Rate limiter with automatic cleanup of expired entries
 * Prevents memory exhaustion from accumulated IP records
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes
const MAX_ENTRIES = 100_000; // Hard cap to prevent memory exhaustion from IP flooding

class RateLimiter {
  private map = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  /**
   * Check if a request should be rate limited
   * Returns null if allowed, or retryAfter seconds if limited
   */
  check(ip: string): { allowed: boolean; retryAfter?: number; remaining: number } {
    this.maybeCleanup();

    const now = Date.now();
    const record = this.map.get(ip);

    if (!record || now > record.resetTime) {
      // Hard cap: if Map is full, block new IPs until cleanup frees space
      if (!record && this.map.size >= MAX_ENTRIES) {
        return { allowed: false, retryAfter: 60, remaining: 0 };
      }
      // First request or window expired
      this.map.set(ip, {
        count: 1,
        resetTime: now + RATE_WINDOW,
      });
      return { allowed: true, remaining: RATE_LIMIT - 1 };
    }

    // Increment counter
    record.count++;

    if (record.count > RATE_LIMIT) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter, remaining: 0 };
    }

    return { allowed: true, remaining: Math.max(0, RATE_LIMIT - record.count) };
  }

  /**
   * Get current rate limit info without incrementing
   */
  getInfo(ip: string): { count: number; resetTime: number; remaining: number } {
    const now = Date.now();
    const record = this.map.get(ip);

    if (!record || now > record.resetTime) {
      return { count: 0, resetTime: now + RATE_WINDOW, remaining: RATE_LIMIT };
    }

    return {
      count: record.count,
      resetTime: record.resetTime,
      remaining: Math.max(0, RATE_LIMIT - record.count),
    };
  }

  /**
   * Cleanup expired entries periodically
   */
  private maybeCleanup(): void {
    const now = Date.now();
    
    // Only cleanup every 5 minutes
    if (now - this.lastCleanup < CLEANUP_INTERVAL) {
      return;
    }

    this.lastCleanup = now;
    // Remove expired entries
    for (const [ip, record] of this.map.entries()) {
      if (now > record.resetTime) {
        this.map.delete(ip);
      }
    }

  }

  /**
   * Force cleanup (useful for testing)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.map.entries()) {
      if (now > record.resetTime) {
        this.map.delete(ip);
      }
    }
    this.lastCleanup = now;
  }

  /**
   * Get current size (for monitoring)
   */
  get size(): number {
    return this.map.size;
  }
}

// Export singleton instance for general API (10 req/min)
export const rateLimiter = new RateLimiter();

// Stricter rate limiter for OpenAI-powered endpoints (3 req/min)
const AI_RATE_LIMIT = 3;
const AI_RATE_WINDOW = 60 * 1000;

class AIRateLimiter {
  private map = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  check(ip: string): { allowed: boolean; retryAfter?: number; remaining: number } {
    const now = Date.now();

    if (now - this.lastCleanup > CLEANUP_INTERVAL) {
      this.lastCleanup = now;
      for (const [key, record] of this.map.entries()) {
        if (now > record.resetTime) {
          this.map.delete(key);
        }
      }
    }

    const record = this.map.get(ip);

    if (!record || now > record.resetTime) {
      if (!record && this.map.size >= MAX_ENTRIES) {
        return { allowed: false, retryAfter: 60, remaining: 0 };
      }
      this.map.set(ip, { count: 1, resetTime: now + AI_RATE_WINDOW });
      return { allowed: true, remaining: AI_RATE_LIMIT - 1 };
    }

    record.count++;

    if (record.count > AI_RATE_LIMIT) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter, remaining: 0 };
    }

    return { allowed: true, remaining: Math.max(0, AI_RATE_LIMIT - record.count) };
  }
}

export const aiRateLimiter = new AIRateLimiter();
export { RATE_LIMIT, RATE_WINDOW };
