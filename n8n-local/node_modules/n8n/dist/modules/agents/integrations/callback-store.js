"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallbackStore = void 0;
const node_crypto_1 = require("node:crypto");
const backend_common_1 = require("@n8n/backend-common");
const DEFAULT_TTL_MS = 60 * 60 * 1000;
const KEY_PREFIX = 'agents:chat-callback';
class CallbackStore {
    constructor(cache, lockService, scope, ttlMs = DEFAULT_TTL_MS) {
        this.cache = cache;
        this.lockService = lockService;
        this.scope = scope;
        this.ttlMs = ttlMs;
    }
    async store(actionId, value, metadata = {}) {
        let key;
        do {
            key = (0, node_crypto_1.randomBytes)(4).toString('hex');
        } while ((await this.cache.get(this.entryCacheKey(key))) !== undefined);
        const payload = { actionId, value, ...metadata };
        await this.cache.set(this.entryCacheKey(key), payload, this.ttlMs);
        if (payload.groupId) {
            const groupCacheKey = this.groupCacheKey(payload.groupId);
            const members = (await this.cache.get(groupCacheKey)) ?? [];
            members.push(key);
            await this.cache.set(groupCacheKey, members, this.ttlMs);
        }
        return key;
    }
    async resolve(key) {
        const peek = await this.cache.get(this.entryCacheKey(key));
        if (!peek)
            return undefined;
        const lockId = peek.groupId
            ? `${this.scope}:group:${peek.groupId}`
            : `${this.scope}:entry:${key}`;
        return await this.lockService.withLease(backend_common_1.LockNamespace.KNOWN_LOCKS, lockId, async () => {
            const entry = await this.cache.get(this.entryCacheKey(key));
            if (!entry)
                return undefined;
            if (entry.groupId) {
                const groupCacheKey = this.groupCacheKey(entry.groupId);
                const members = (await this.cache.get(groupCacheKey)) ?? [key];
                await this.cache.deleteMany([
                    ...members.map((member) => this.entryCacheKey(member)),
                    groupCacheKey,
                ]);
            }
            else {
                await this.cache.delete(this.entryCacheKey(key));
            }
            return entry;
        });
    }
    entryCacheKey(key) {
        return `${KEY_PREFIX}:${this.scope}:entry:${key}`;
    }
    groupCacheKey(groupId) {
        const hash = (0, node_crypto_1.createHash)('sha256').update(groupId).digest('hex');
        return `${KEY_PREFIX}:${this.scope}:group:${hash}`;
    }
}
exports.CallbackStore = CallbackStore;
//# sourceMappingURL=callback-store.js.map