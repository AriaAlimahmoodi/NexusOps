export declare class TtlMap<K, V> {
    private readonly ttlMs;
    private readonly onExpire?;
    private readonly store;
    private sweepTimer;
    constructor(ttlMs: number, sweepIntervalMs?: number, onExpire?: ((value: V) => void) | undefined);
    private deleteIfExpired;
    set(key: K, value: V): this;
    get(key: K): V | undefined;
    has(key: K): boolean;
    touch(key: K): boolean;
    delete(key: K): boolean;
    keys(): IterableIterator<K>;
    entries(): IterableIterator<[K, V]>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
    get size(): number;
    clear(): void;
    sweep(): void;
    dispose(): void;
}
