// Global cache utility for better performance
class Cache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes
  }

  set(key, value, maxAge = this.maxAge) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      maxAge,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const globalCache = new Cache();

// Cache keys
export const CACHE_KEYS = {
  COURSES: "courses",
  COURSE_DETAIL: (id) => `course-${id}`,
  ATTENDANCE_STATS: (courseId, role) => `attendance-stats-${courseId}-${role}`,
  ATTENDANCE_DATA: (courseId) => `attendance-data-${courseId}`,
  DASHBOARD_STATS: (role) => `dashboard-stats-${role}`,
};

// Cache utilities
export const cacheUtils = {
  // Cache API responses
  cacheApiResponse: (key, data, maxAge = 5 * 60 * 1000) => {
    globalCache.set(key, data, maxAge);
  },

  // Get cached API response
  getCachedResponse: (key) => {
    return globalCache.get(key);
  },

  // Clear specific cache entries
  clearCache: (pattern) => {
    for (const key of globalCache.cache.keys()) {
      if (key.includes(pattern)) {
        globalCache.delete(key);
      }
    }
  },

  // Clear all cache
  clearAllCache: () => {
    globalCache.clear();
  },
};

// Cleanup expired cache entries every minute
setInterval(() => {
  globalCache.cleanup();
}, 60 * 1000);

export default globalCache;
