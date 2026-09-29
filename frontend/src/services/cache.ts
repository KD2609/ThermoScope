/**
 * Centralized in-memory request cache and concurrent request deduplicator.
 * Prevents redundant database round-trips, duplicate React StrictMode queries,
 * and preserves data across client-side route navigation.
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes session cache

/**
 * Perform a cached fetch with concurrent request deduplication.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
  forceFresh: boolean = false
): Promise<T> {
  const now = Date.now();
  const effectiveTtl = Math.max(ttlMs, DEFAULT_TTL_MS);

  // 1. Check valid cache if not forcing fresh fetch
  if (!forceFresh) {
    const entry = memoryCache.get(key);
    if (entry && now - entry.ts < Math.max(entry.ttl, effectiveTtl)) {
      return entry.data as T;
    }
  }

  // 2. Request deduplication: return existing in-flight promise if one is already running
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  // 3. Initiate request and track in-flight
  const requestPromise = (async () => {
    try {
      const data = await fetcher();
      memoryCache.set(key, {
        data,
        ts: Date.now(),
        ttl: effectiveTtl,
      });
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
}

/**
 * Synchronously retrieve cached data if available and unexpired.
 * Allows components to render cached data instantly without flashing spinners.
 */
export function getCachedData<T>(key: string, maxAgeMs?: number): T | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  const allowedAge = maxAgeMs ?? Math.max(entry.ttl, DEFAULT_TTL_MS);
  if (Date.now() - entry.ts > allowedAge) return undefined;
  return entry.data as T;
}

/**
 * Check if unexpired cached data exists for key.
 */
export function hasCachedData(key: string, maxAgeMs?: number): boolean {
  return getCachedData(key, maxAgeMs) !== undefined;
}

/**
 * Store or update an entry in the cache manually.
 */
export function setCachedData<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  memoryCache.set(key, {
    data,
    ts: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Invalidate cache entries matching a prefix or regex pattern.
 */
export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (typeof pattern === 'string' ? key.startsWith(pattern) : pattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}
