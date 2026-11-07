"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChatSubscriptionStateAdapter = void 0;
const agent_channel_1 = require("../utils/agent-channel");
const NEGATIVE_SUBSCRIPTION_CACHE_TTL_MS = 30_000;
class AgentChatSubscriptionStateAdapter {
    constructor(scope, integration, delegate, repository, publishChange, onDisconnect) {
        this.scope = scope;
        this.integration = integration;
        this.delegate = delegate;
        this.repository = repository;
        this.publishChange = publishChange;
        this.onDisconnect = onDisconnect;
        this.connected = false;
        this.negativeSubscriptionCache = new Map();
    }
    get key() {
        return (0, agent_channel_1.agentChannelKey)(this.scope);
    }
    async connect() {
        await this.delegate.connect();
        this.connected = true;
        this.negativeSubscriptionCache.clear();
        for (const threadId of await this.repository.listThreadIdsForConnection(this.scope)) {
            await this.delegate.subscribe(threadId);
        }
    }
    async disconnect() {
        try {
            await this.delegate.disconnect();
        }
        finally {
            this.connected = false;
            this.onDisconnect(this);
        }
    }
    async subscribe(threadId) {
        await this.repository.subscribe(this.scope, threadId);
        this.negativeSubscriptionCache.delete(threadId);
        await this.delegate.subscribe(threadId);
        await this.publishChange(this.integration, threadId, 'subscribe');
    }
    async unsubscribe(threadId) {
        await this.repository.unsubscribe(this.scope, threadId);
        await this.delegate.unsubscribe(threadId);
        this.rememberNegativeSubscription(threadId);
        await this.publishChange(this.integration, threadId, 'unsubscribe');
    }
    async isSubscribed(threadId) {
        if (await this.delegate.isSubscribed(threadId))
            return true;
        if (!this.connected)
            return false;
        if (this.hasFreshNegativeSubscription(threadId))
            return false;
        if (await this.repository.isSubscribed(this.scope, threadId)) {
            this.negativeSubscriptionCache.delete(threadId);
            await this.delegate.subscribe(threadId);
            return true;
        }
        this.rememberNegativeSubscription(threadId);
        return false;
    }
    async applyRemoteChange(threadId, action) {
        if (!this.connected)
            return;
        if (action === 'subscribe') {
            this.negativeSubscriptionCache.delete(threadId);
            await this.delegate.subscribe(threadId);
            return;
        }
        await this.delegate.unsubscribe(threadId);
        this.rememberNegativeSubscription(threadId);
    }
    hasFreshNegativeSubscription(threadId) {
        const expiresAt = this.negativeSubscriptionCache.get(threadId);
        if (expiresAt === undefined)
            return false;
        if (expiresAt > Date.now())
            return true;
        this.negativeSubscriptionCache.delete(threadId);
        return false;
    }
    rememberNegativeSubscription(threadId) {
        const now = Date.now();
        this.pruneExpiredNegativeSubscriptions(now);
        this.negativeSubscriptionCache.set(threadId, now + NEGATIVE_SUBSCRIPTION_CACHE_TTL_MS);
    }
    pruneExpiredNegativeSubscriptions(now) {
        for (const [threadId, expiresAt] of this.negativeSubscriptionCache) {
            if (expiresAt <= now)
                this.negativeSubscriptionCache.delete(threadId);
        }
    }
    async acquireLock(threadId, ttlMs) {
        return await this.delegate.acquireLock(threadId, ttlMs);
    }
    async appendToList(key, value, options) {
        await this.delegate.appendToList(key, value, options);
    }
    async delete(key) {
        await this.delegate.delete(key);
    }
    async dequeue(threadId) {
        return await this.delegate.dequeue(threadId);
    }
    async enqueue(threadId, entry, maxSize) {
        return await this.delegate.enqueue(threadId, entry, maxSize);
    }
    async extendLock(lock, ttlMs) {
        return await this.delegate.extendLock(lock, ttlMs);
    }
    async forceReleaseLock(threadId) {
        await this.delegate.forceReleaseLock(threadId);
    }
    async get(key) {
        return await this.delegate.get(key);
    }
    async getList(key) {
        return await this.delegate.getList(key);
    }
    async queueDepth(threadId) {
        return await this.delegate.queueDepth(threadId);
    }
    async releaseLock(lock) {
        await this.delegate.releaseLock(lock);
    }
    async set(key, value, ttlMs) {
        await this.delegate.set(key, value, ttlMs);
    }
    async setIfNotExists(key, value, ttlMs) {
        return await this.delegate.setIfNotExists(key, value, ttlMs);
    }
}
exports.AgentChatSubscriptionStateAdapter = AgentChatSubscriptionStateAdapter;
//# sourceMappingURL=agent-chat-subscription-state.adapter.js.map