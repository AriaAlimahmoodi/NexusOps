"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSessionStore = void 0;
class RedisSessionStore {
    constructor(publisher, getSessionKey, ttl) {
        this.publisher = publisher;
        this.getSessionKey = getSessionKey;
        this.ttl = ttl;
        this.tools = {};
    }
    async register(sessionId) {
        await this.publisher.set(this.getSessionKey(sessionId), '1', this.ttl);
    }
    async validate(sessionId) {
        const result = await this.publisher.get(this.getSessionKey(sessionId));
        return result !== null;
    }
    async unregister(sessionId) {
        await this.publisher.clear(this.getSessionKey(sessionId));
        delete this.tools[sessionId];
    }
    getTools(sessionId) {
        return this.tools[sessionId];
    }
    setTools(sessionId, tools) {
        this.tools[sessionId] = tools;
    }
    clearTools(sessionId) {
        delete this.tools[sessionId];
    }
}
exports.RedisSessionStore = RedisSessionStore;
//# sourceMappingURL=RedisSessionStore.js.map