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
exports.DynamicCredentialWebService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const zod_1 = require("zod");
const auth_service_1 = require("../../../auth/auth.service");
const errors_1 = require("@n8n/errors");
class AuthSourceQuerySchema extends api_types_1.Z.class({
    authSource: zod_1.z.enum(['bearer', 'cookie']).optional(),
}) {
}
const BEARER_TOKEN_REGEX = /^[Bb][Ee][Aa][Rr][Ee][Rr]\s+(.+)$/;
function getBearerToken(req) {
    const headerValue = req.headers['authorization']?.toString();
    if (!headerValue) {
        return null;
    }
    const result = BEARER_TOKEN_REGEX.exec(headerValue);
    const token = result ? result[1] : null;
    if (!token) {
        return null;
    }
    return token;
}
let DynamicCredentialWebService = class DynamicCredentialWebService {
    constructor(authService, executionContextService) {
        this.authService = authService;
        this.executionContextService = executionContextService;
    }
    buildCookieCredentialContext(req) {
        const sessionCookie = this.authService.getCookieToken(req);
        if (sessionCookie === undefined) {
            throw new errors_1.UnauthenticatedError('Session cookie is missing');
        }
        return this.executionContextService.buildRequestBoundCredentialContext(sessionCookie, {
            method: this.authService.getMethod(req),
            endpoint: this.authService.getEndpoint(req),
            browserId: this.authService.getBrowserId(req),
        });
    }
    getCredentialContextFromRequest(req) {
        const parseResult = AuthSourceQuerySchema.safeParse(req.query);
        if (parseResult.success && parseResult.data.authSource !== undefined) {
            const { authSource } = parseResult.data;
            if (authSource === 'bearer') {
                const token = getBearerToken(req);
                if (token === null) {
                    throw new errors_1.UnauthenticatedError('Bearer token is missing');
                }
                return {
                    identity: token,
                    version: 1,
                    metadata: {},
                };
            }
            else if (authSource === 'cookie') {
                return this.buildCookieCredentialContext(req);
            }
            else {
                throw new errors_1.UnauthenticatedError('Invalid auth source');
            }
        }
        const token = getBearerToken(req);
        if (token !== null) {
            return {
                identity: token,
                version: 1,
                metadata: {},
            };
        }
        return this.buildCookieCredentialContext(req);
    }
};
exports.DynamicCredentialWebService = DynamicCredentialWebService;
exports.DynamicCredentialWebService = DynamicCredentialWebService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService, n8n_core_1.ExecutionContextService])
], DynamicCredentialWebService);
//# sourceMappingURL=dynamic-credential-web.service.js.map