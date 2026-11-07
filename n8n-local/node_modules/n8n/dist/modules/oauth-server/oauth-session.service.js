"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthSessionService = exports.OAUTH_SESSION_COOKIE_PREFIX = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const backend_services_1 = require("@n8n/backend-services");
const oauthSessionPayloadSchema = zod_1.z.object({
    clientId: zod_1.z.string(),
    redirectUri: zod_1.z.string(),
    codeChallenge: zod_1.z.string(),
    state: zod_1.z.string().nullable(),
    resource: zod_1.z.string().optional(),
    requestedScopes: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.OAUTH_SESSION_COOKIE_PREFIX = 'n8n-oauth-session-';
const SESSION_EXPIRY_MS = 10 * constants_1.Time.minutes.toMilliseconds;
const MAX_PENDING_FLOWS = 3;
const FLOW_ID_PATTERN = /^[0-9a-z]{6,12}-[0-9a-f]{24}$/;
let OAuthSessionService = class OAuthSessionService {
    constructor(jwtService, globalConfig) {
        this.jwtService = jwtService;
        this.globalConfig = globalConfig;
    }
    createSession(res, payload) {
        const flowId = this.newFlowId();
        const sessionToken = this.jwtService.sign('oauthSession', payload, {
            expiresIn: '10m',
        });
        this.evictOldestFlows(res, MAX_PENDING_FLOWS - 1);
        res.cookie(exports.OAUTH_SESSION_COOKIE_PREFIX + flowId, sessionToken, {
            ...this.cookieOptions(),
            maxAge: SESSION_EXPIRY_MS,
        });
        return flowId;
    }
    verifySession(sessionToken) {
        const payload = this.jwtService.verify('oauthSession', sessionToken);
        return oauthSessionPayloadSchema.parse(payload);
    }
    clearSession(res, flowId) {
        if (!FLOW_ID_PATTERN.test(flowId))
            return;
        res.clearCookie(exports.OAUTH_SESSION_COOKIE_PREFIX + flowId, this.cookieOptions());
    }
    getSessionToken(cookies, flowId) {
        if (!FLOW_ID_PATTERN.test(flowId))
            return undefined;
        return cookies[exports.OAUTH_SESSION_COOKIE_PREFIX + flowId];
    }
    newFlowId() {
        return `${Date.now().toString(36)}-${(0, node_crypto_1.randomBytes)(12).toString('hex')}`;
    }
    evictOldestFlows(res, keep) {
        const pending = Object.keys(this.parsedCookies(res.req))
            .filter((name) => name.startsWith(exports.OAUTH_SESSION_COOKIE_PREFIX))
            .sort();
        for (const name of pending.slice(0, Math.max(0, pending.length - keep))) {
            res.clearCookie(name, this.cookieOptions());
        }
    }
    cookieOptions() {
        const { secure, samesite } = this.globalConfig.auth.cookie;
        return {
            httpOnly: true,
            secure,
            sameSite: samesite === 'strict' ? 'lax' : samesite,
        };
    }
    parsedCookies(req) {
        const cookies = req.cookies;
        if (cookies === null || typeof cookies !== 'object')
            return {};
        return { ...cookies };
    }
};
exports.OAuthSessionService = OAuthSessionService;
exports.OAuthSessionService = OAuthSessionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_services_1.JwtService, config_1.GlobalConfig])
], OAuthSessionService);
//# sourceMappingURL=oauth-session.service.js.map