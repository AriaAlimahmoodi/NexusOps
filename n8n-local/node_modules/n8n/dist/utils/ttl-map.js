"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtlMap = void 0;
class TtlMap {
    constructor(ttlMs, sweepIntervalMs = ttlMs, onExpire) {
        this.ttlMs = ttlMs;
        this.onExpire = onExpire;
        this.store = new Map();
        this.sweepTimer = null;
        if (sweepIntervalMs > 0) {
            this.sweepTimer = setInterval(() => this.sweep(), sweepIntervalMs).unref();
        }
    }
    deleteIfExpired(key, entry, now = Date.now()) {
        if (now <= entry.expiresAt)
            return false;
        if (this.store.delete(key))
            this.onExpire?.(entry.value);
        return true;
    }
    set(key, value) {
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        return this;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (this.deleteIfExpired(key, entry))
            return undefined;
        return entry.value;
    }
    has(key) {
        const entry = this.store.get(key);
        return entry !== undefined && !this.deleteIfExpired(key, entry);
    }
    touch(key) {
        const entry = this.store.get(key);
        if (!entry)
            return false;
        if (this.deleteIfExpired(key, entry))
            return false;
        entry.expiresAt = Date.now() + this.ttlMs;
        return true;
    }
    delete(key) {
        return this.store.delete(key);
    }
    keys() {
        this.sweep();
        return this.store.keys();
    }
    *entries() {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now <= entry.expiresAt) {
                yield [key, entry.value];
            }
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
    get size() {
        this.sweep();
        return this.store.size;
    }
    clear() {
        this.store.clear();
    }
    sweep() {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            this.deleteIfExpired(key, entry, now);
        }
    }
    dispose() {
        if (this.sweepTimer) {
            clearInterval(this.sweepTimer);
            this.sweepTimer = null;
        }
    }
}
exports.TtlMap = TtlMap;
//# sourceMappingURL=ttl-map.js.map