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
exports.SessionCookieAuthStrategy = void 0;
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_service_1 = require("../auth/auth.service");
const constants_1 = require("../constants");
const errors_1 = require("@n8n/errors");
let SessionCookieAuthStrategy = class SessionCookieAuthStrategy {
    constructor(authService) {
        this.authService = authService;
    }
    async buildTokenGrant(_token, _options) {
        return null;
    }
    async authenticate(req) {
        const token = req.cookies[constants_1.AUTH_COOKIE_NAME];
        if (!token)
            return null;
        try {
            const user = await this.authService.authenticateUserBasedOnToken(token, req.method, this.authService.getEndpoint(req), this.authService.getBrowserId(req));
            const tokenGrant = this.toGrant(user);
            req.user = user;
            req.tokenGrant = tokenGrant;
            return true;
        }
        catch (error) {
            if (this.isAuthFailure(error))
                return false;
            throw error;
        }
    }
    toGrant(user) {
        return {
            scopes: user.role.scopes.map((s) => s.slug),
            subject: user,
            apiKeyScopes: (0, permissions_1.getApiKeyScopesForRole)(user),
        };
    }
    isAuthFailure(error) {
        return (error instanceof errors_1.AuthError ||
            error instanceof jsonwebtoken_1.TokenExpiredError ||
            error instanceof jsonwebtoken_1.JsonWebTokenError);
    }
};
exports.SessionCookieAuthStrategy = SessionCookieAuthStrategy;
exports.SessionCookieAuthStrategy = SessionCookieAuthStrategy = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], SessionCookieAuthStrategy);
//# sourceMappingURL=session-cookie-auth.strategy.js.map