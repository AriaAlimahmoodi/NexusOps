"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
class LRUCache {
    constructor(options) {
        this.map = new Map();
        this.maxEntries = options?.maxEntries ?? 100;
        this.ttlMs = options?.ttlMs ?? 15 * 60 * 1000;
    }
    get(key) {
        const entry = this.map.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.map.delete(key);
            return undefined;
        }
        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }
    set(key, value) {
        this.map.delete(key);
        if (this.map.size >= this.maxEntries) {
            const oldest = this.map.keys().next().value;
            if (oldest !== undefined) {
                this.map.delete(oldest);
            }
        }
        this.map.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
    }
    get size() {
        return this.map.size;
    }
    clear() {
        this.map.clear();
    }
}
exports.LRUCache = LRUCache;
//# sourceMappingURL=cache.js.map