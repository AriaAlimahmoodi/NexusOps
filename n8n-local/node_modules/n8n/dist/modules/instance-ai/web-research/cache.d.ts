export declare class LRUCache<T> {
    private readonly map;
    private readonly maxEntries;
    private readonly ttlMs;
    constructor(options?: {
        maxEntries?: number;
        ttlMs?: number;
    });
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    get size(): number;
    clear(): void;
}
