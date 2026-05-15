import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

export const mentorRateLimit = redis
  ? new Ratelimit({
      redis,
      // 50 mentor messages per user per day (Pro tier)
      limiter: Ratelimit.tokenBucket(50, "1 d", 50),
      analytics: true,
      prefix: "mentor",
    })
  : null;

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "api",
    })
  : null;

interface InMemoryBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, InMemoryBucket>();

/** Tagespeicherung im Prozessspeicher — Fallback, falls Upstash fehlt. */
export function inMemoryDailyLimit(key: string, limit: number) {
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: tomorrow.getTime() });
    return { success: true, remaining: limit - 1, reset: tomorrow.getTime() };
  }
  if (bucket.count >= limit) {
    return { success: false, remaining: 0, reset: bucket.resetAt };
  }
  bucket.count += 1;
  return {
    success: true,
    remaining: limit - bucket.count,
    reset: bucket.resetAt,
  };
}
