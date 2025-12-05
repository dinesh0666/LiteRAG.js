import { InMemoryCache } from '../core/cache';

describe('InMemoryCache', () => {
    let cache: InMemoryCache<string>;

    beforeEach(() => {
        cache = new InMemoryCache<string>();
    });

    it('should store and retrieve values', async () => {
        await cache.set('key1', 'value1');
        const value = await cache.get('key1');
        expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
        const value = await cache.get('nonexistent');
        expect(value).toBeNull();
    });

    it('should delete values', async () => {
        await cache.set('key1', 'value1');
        await cache.delete('key1');
        const value = await cache.get('key1');
        expect(value).toBeNull();
    });

    it('should clear all values', async () => {
        await cache.set('key1', 'value1');
        await cache.set('key2', 'value2');
        await cache.clear();
        expect(cache.size()).toBe(0);
    });

    it('should respect TTL', async () => {
        await cache.set('key1', 'value1', 1); // 1 second TTL

        // Should exist immediately
        let value = await cache.get('key1');
        expect(value).toBe('value1');

        // Wait for expiry
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Should be expired
        value = await cache.get('key1');
        expect(value).toBeNull();
    });

    it('should handle multiple values', async () => {
        await cache.set('key1', 'value1');
        await cache.set('key2', 'value2');
        await cache.set('key3', 'value3');

        expect(cache.size()).toBe(3);
        expect(await cache.get('key1')).toBe('value1');
        expect(await cache.get('key2')).toBe('value2');
        expect(await cache.get('key3')).toBe('value3');
    });
});
