"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineV2PushRegistry = void 0;
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const engine_v2_push_session_1 = require("../services/engine-v2-push-session");
const SESSION_TTL_MS = 12 * constants_1.Time.hours.toMilliseconds;
const MAX_SESSIONS = 1000;
let EngineV2PushRegistry = class EngineV2PushRegistry {
    constructor() {
        this.sessions = new Map();
    }
    register(executionId, init) {
        this.evict();
        this.sessions.set(executionId, new engine_v2_push_session_1.EngineV2PushSession(init.pushRef, init.workflowId, init.trigger));
    }
    get(executionId) {
        const session = this.sessions.get(executionId);
        if (session)
            session.lastSeenAt = Date.now();
        return session;
    }
    release(executionId) {
        this.sessions.delete(executionId);
    }
    evict() {
        const cutoff = Date.now() - SESSION_TTL_MS;
        for (const [executionId, session] of this.sessions) {
            if (session.lastSeenAt < cutoff)
                this.sessions.delete(executionId);
        }
        const excess = this.sessions.size - MAX_SESSIONS + 1;
        if (excess <= 0)
            return;
        const oldestFirst = [...this.sessions].sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt);
        for (const [executionId] of oldestFirst.slice(0, excess)) {
            this.sessions.delete(executionId);
        }
    }
};
exports.EngineV2PushRegistry = EngineV2PushRegistry;
exports.EngineV2PushRegistry = EngineV2PushRegistry = __decorate([
    (0, di_1.Service)()
], EngineV2PushRegistry);
//# sourceMappingURL=engine-v2-push-registry.service.js.map