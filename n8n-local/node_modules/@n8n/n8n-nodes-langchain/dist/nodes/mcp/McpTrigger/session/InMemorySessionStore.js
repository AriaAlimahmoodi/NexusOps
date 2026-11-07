"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySessionStore = void 0;
class InMemorySessionStore {
    constructor() {
        this.sessions = new Set();
        this.tools = {};
    }
    async register(sessionId) {
        this.sessions.add(sessionId);
    }
    async validate(sessionId) {
        return this.sessions.has(sessionId);
    }
    async unregister(sessionId) {
        this.sessions.delete(sessionId);
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
exports.InMemorySessionStore = InMemorySessionStore;
//# sourceMappingURL=InMemorySessionStore.js.map