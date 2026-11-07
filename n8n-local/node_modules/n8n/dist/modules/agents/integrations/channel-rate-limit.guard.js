"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelRateLimitGuard = void 0;
const di_1 = require("@n8n/di");
const channel_rate_limit_1 = require("./channel-rate-limit");
let ChannelRateLimitGuard = class ChannelRateLimitGuard {
    constructor() {
        this.blockedUntilMs = new Map();
    }
    isBlocked(connectionId, nowMs = Date.now()) {
        if (!connectionId)
            return false;
        const until = this.blockedUntilMs.get(connectionId);
        if (until === undefined)
            return false;
        if (nowMs >= until) {
            this.blockedUntilMs.delete(connectionId);
            return false;
        }
        return true;
    }
    record(connectionId, nowMs = Date.now()) {
        if (!connectionId)
            return;
        const until = nowMs + channel_rate_limit_1.CHANNEL_RATE_LIMIT_COOLDOWN_MS;
        const existing = this.blockedUntilMs.get(connectionId) ?? 0;
        this.blockedUntilMs.set(connectionId, Math.max(until, existing));
    }
};
exports.ChannelRateLimitGuard = ChannelRateLimitGuard;
exports.ChannelRateLimitGuard = ChannelRateLimitGuard = __decorate([
    (0, di_1.Service)()
], ChannelRateLimitGuard);
//# sourceMappingURL=channel-rate-limit.guard.js.map