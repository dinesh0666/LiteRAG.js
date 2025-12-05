/**
 * Cache interface for query results
 */
export interface Cache<T> {
    get(key: string): Promise<T | null>;
    set(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}

/**
 * In-memory cache implementation with TTL support
 */
export class InMemoryCache<T> implements Cache<T> {
    private cache: Map<string, { value: T; expiry?: number }> = new Map();

    async get(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (item.expiry && Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    async set(key: string, value: T, ttl?: number): Promise<void> {
        const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
        this.cache.set(key, { value, expiry });
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }
}
