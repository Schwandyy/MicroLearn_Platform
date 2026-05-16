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

/** Sliding-Window-Limits für User-generated Content. */
export const ugcLimits = redis
  ? {
      project: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: true,
        prefix: "ugc:project",
      }),
      comment: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 h"),
        analytics: true,
        prefix: "ugc:comment",
      }),
      like: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(120, "1 h"),
        analytics: true,
        prefix: "ugc:like",
      }),
      upload: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        analytics: true,
        prefix: "ugc:upload",
      }),
    }
  : null;

interface SlidingBucket {
  hits: number[];
}
const slidingBuckets = new Map<string, SlidingBucket>();

/** In-Memory Sliding-Window-Limit (Fallback ohne Redis). */
export function inMemorySlidingLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { success: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  const bucket = slidingBuckets.get(opts.key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > cutoff);
  if (bucket.hits.length >= opts.limit) {
    slidingBuckets.set(opts.key, bucket);
    return { success: false, remaining: 0 };
  }
  bucket.hits.push(now);
  slidingBuckets.set(opts.key, bucket);
  return { success: true, remaining: opts.limit - bucket.hits.length };
}

export type UgcLimitKind = "project" | "comment" | "like" | "upload";

const UGC_FALLBACK: Record<UgcLimitKind, { limit: number; windowMs: number }> = {
  project: { limit: 5, windowMs: 3600_000 },
  comment: { limit: 30, windowMs: 3600_000 },
  like: { limit: 120, windowMs: 3600_000 },
  upload: { limit: 20, windowMs: 3600_000 },
};

/**
 * Wrapper: nutzt Upstash wenn da, sonst In-Memory.
 * Identifier sollte stabil pro User+Aktion sein.
 */
export async function ugcLimit(
  kind: UgcLimitKind,
  identifier: string,
): Promise<{ success: boolean; remaining: number }> {
  const upstash = ugcLimits?.[kind];
  if (upstash) {
    const r = await upstash.limit(identifier);
    return { success: r.success, remaining: r.remaining };
  }
  return inMemorySlidingLimit({
    key: `${kind}:${identifier}`,
    ...UGC_FALLBACK[kind],
  });
}

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
