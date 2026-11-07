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
exports.OAuthBrowserBindingService = exports.OAUTH_BINDING_COOKIE_NAME = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const crypto_1 = require("crypto");
exports.OAUTH_BINDING_COOKIE_NAME = 'n8n-oauth-binding';
const NONCE_BYTES = 32;
let OAuthBrowserBindingService = class OAuthBrowserBindingService {
    constructor(globalConfig) {
        this.globalConfig = globalConfig;
    }
    isEnabled() {
        return this.globalConfig.auth.oauthBrowserBinding;
    }
    ensureBindingCookie(req, res) {
        const existing = this.readCookie(req);
        if (existing) {
            return existing;
        }
        const nonce = (0, crypto_1.randomBytes)(NONCE_BYTES).toString('base64url');
        const { secure, samesite } = this.globalConfig.auth.cookie;
        const sameSite = samesite === 'strict' ? 'lax' : samesite;
        res.cookie(exports.OAUTH_BINDING_COOKIE_NAME, nonce, {
            httpOnly: true,
            secure,
            sameSite,
            path: `/${this.globalConfig.endpoints.rest}`,
        });
        return nonce;
    }
    computeHash(nonce) {
        return (0, crypto_1.createHash)('sha256').update(nonce).digest('base64url');
    }
    verifyBinding(req, expectedHash) {
        const cookieValue = this.readCookie(req);
        if (!cookieValue) {
            return { ok: false, reason: 'cookie-missing' };
        }
        const actualHash = this.computeHash(cookieValue);
        const actualBuf = Buffer.from(actualHash);
        const expectedBuf = Buffer.from(expectedHash);
        if (actualBuf.length !== expectedBuf.length || !(0, crypto_1.timingSafeEqual)(actualBuf, expectedBuf)) {
            return { ok: false, reason: 'hash-mismatch' };
        }
        return { ok: true };
    }
    readCookie(req) {
        const cookies = req.cookies;
        const value = cookies?.[exports.OAUTH_BINDING_COOKIE_NAME];
        return typeof value === 'string' && value.length > 0 ? value : undefined;
    }
};
exports.OAuthBrowserBindingService = OAuthBrowserBindingService;
exports.OAuthBrowserBindingService = OAuthBrowserBindingService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig])
], OAuthBrowserBindingService);
//# sourceMappingURL=oauth-browser-binding.service.js.map