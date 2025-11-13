import NodeCache from "node-cache";

// Create a cache instance with default TTL of 5 minutes
export const cache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Better performance for large objects
});

// Cache key generators
export const cacheKeys = {
  threads: (farmerId: string, includeClosed: boolean) =>
    `threads:${farmerId}:${includeClosed}`,
  threadDetail: (threadId: string, farmerId: string) =>
    `thread:${threadId}:${farmerId}`,
  opportunities: (farmerId: string) => `opportunities:${farmerId}`,
  mileBalance: (farmerId: string) => `mileBalance:${farmerId}`,
  search: (query: string, type: string, farmerId?: string) =>
    `search:${query}:${type}:${farmerId ?? "all"}`,
};

// Helper to invalidate related cache entries
export const invalidateThreadCache = (farmerId: string) => {
  cache.del(cacheKeys.threads(farmerId, true));
  cache.del(cacheKeys.threads(farmerId, false));
  cache.del(cacheKeys.opportunities(farmerId));
};

export const invalidateThreadDetailCache = (threadId: string, farmerId: string) => {
  cache.del(cacheKeys.threadDetail(threadId, farmerId));
  invalidateThreadCache(farmerId);
};

