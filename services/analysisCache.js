const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour
const MAX_ENTRIES = 100;

const cache = new Map();

const pruneIfNeeded = () => {
  if (cache.size <= MAX_ENTRIES) return;
  const oldestKey = cache.keys().next().value;
  if (oldestKey) {
    cache.delete(oldestKey);
  }
};

export const buildAnalysisCacheKey = ({ videoHash, contextHash }) => {
  return `${videoHash || 'nohash'}::${contextHash || 'nocontext'}`;
};

export const getCachedAnalysis = (key) => {
  if (!key) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.payload;
};

export const setCachedAnalysis = (key, payload, ttlMs = DEFAULT_TTL_MS) => {
  if (!key || !payload) return;
  cache.set(key, {
    payload,
    expiresAt: Date.now() + ttlMs,
  });
  pruneIfNeeded();
};




