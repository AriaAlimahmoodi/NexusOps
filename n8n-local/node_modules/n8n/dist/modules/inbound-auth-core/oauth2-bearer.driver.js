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
exports.Oauth2BearerDriver = void 0;
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const jsonwebtoken_1 = require("jsonwebtoken");
const backend_common_1 = require("@n8n/backend-common");
const key_utils_1 = require("./key.utils");
const isJwtFailure = (error) => typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string';
const normalizeAudiences = (aud) => {
    if (typeof aud === 'string')
        return [aud];
    if (Array.isArray(aud))
        return aud.filter((entry) => typeof entry === 'string');
    return [];
};
let Oauth2BearerDriver = class Oauth2BearerDriver extends inbound_auth_1.AuthenticationDriver {
    constructor(store, localServer, logger) {
        super();
        this.store = store;
        this.localServer = localServer;
        this.credentialKind = 'bearer';
        this.sourceTypes = ['oauth2'];
        this.logger = logger.scoped('inbound-auth');
    }
    async selectSource(extracted) {
        let issuer;
        try {
            const decoded = (0, jsonwebtoken_1.decode)(extracted.credential.token);
            issuer =
                typeof decoded === 'object' && decoded !== null && typeof decoded.iss === 'string'
                    ? decoded.iss
                    : undefined;
        }
        catch (error) {
            this.logger.warn('Failed to decode JWT', { error });
        }
        return issuer ? await this.store.getByIssuer(issuer) : undefined;
    }
    reject(error) {
        if (!isJwtFailure(error))
            return { ok: false, reason: 'signature-invalid' };
        switch (error.name) {
            case 'TokenExpiredError':
                return { ok: false, reason: 'expired', detail: error.message };
            case 'JsonWebTokenError':
                if (error.message === 'jwt must be provided')
                    return { ok: false, reason: 'not-an-access-token' };
                if (error.message.startsWith('jwt audience invalid'))
                    return { ok: false, reason: 'audience-mismatch', detail: error.message };
                return { ok: false, reason: 'signature-invalid', detail: error.message };
            case 'NotBeforeError':
                return { ok: false, reason: 'expired', detail: error.message };
            default:
                return { ok: false, reason: 'signature-invalid', detail: error.name };
        }
    }
    async verify(extracted, source) {
        const { authentication } = source.config;
        const jwks = source.metadata?.documents.find((doc) => doc.kind === 'jwks');
        if (!jwks) {
            return {
                ok: false,
                reason: 'source-unusable',
                detail: 'JWKS document not found',
            };
        }
        const allowedAudiences = source.config.surfaces[extracted.surface]?.audiences ?? extracted.resource.acceptedAudiences;
        let token;
        try {
            token = await new Promise((resolve, reject) => {
                (0, jsonwebtoken_1.verify)(extracted.credential.token, (header, keyCallback) => {
                    if (!header.kid) {
                        return keyCallback(new Error('Missing kid in JWT header'));
                    }
                    const key = (0, key_utils_1.getPublicKeyFromJwk)(jwks.keys, header.kid);
                    if (!key) {
                        return keyCallback(new Error('Public key not found for the given kid'));
                    }
                    keyCallback(null, key);
                }, {
                    issuer: source.issuer,
                    algorithms: authentication.algorithms,
                    clockTolerance: authentication.clockSkewSeconds,
                    complete: true,
                }, (jwtError, decoded) => {
                    if (jwtError) {
                        reject(jwtError);
                    }
                    else {
                        if (!decoded) {
                            reject(new Error('Decoded JWT is undefined'));
                            return;
                        }
                        resolve(decoded);
                    }
                });
            });
        }
        catch (error) {
            return this.reject(error);
        }
        const { typ } = token.header;
        const allowedTokenTypes = authentication.allowedTokenTypes;
        if (!typ || !allowedTokenTypes.includes(typ)) {
            return { ok: false, reason: 'not-an-access-token' };
        }
        const payload = typeof token.payload === 'object' && token.payload !== null ? token.payload : {};
        const { exp, iat } = payload;
        if (typeof exp !== 'number' || typeof iat !== 'number')
            return { ok: false, reason: 'expired' };
        const max = authentication.maxTokenLifetimeSeconds;
        if (exp - iat > max)
            return {
                ok: false,
                reason: 'expired',
                detail: `lifetime ${exp - iat}s exceeds the source maximum of ${max}s`,
            };
        if (iat > Math.floor(Date.now() / 1000) + authentication.clockSkewSeconds) {
            return { ok: false, reason: 'expired', detail: 'Token is not yet valid' };
        }
        const tokenAudiences = normalizeAudiences(payload.aud);
        if (!tokenAudiences.some((aud) => allowedAudiences.includes(aud))) {
            return {
                ok: false,
                reason: 'audience-mismatch',
                detail: 'JWT audience is not allowed',
            };
        }
        if (authentication.keys.kind === 'local-keystore' &&
            !(await this.localServer.isAccessTokenActive(extracted.credential.token))) {
            return { ok: false, reason: 'revoked' };
        }
        const { credential, request: { headers: _headers, ...request }, ...rest } = extracted;
        return {
            ok: true,
            value: {
                ...rest,
                request,
                credentialKind: credential.kind,
                source,
                claims: payload,
                expiresAt: new Date(exp * 1000),
            },
        };
    }
    advertise(resource, sources) {
        try {
            const url = new URL(resource.resource.url);
            const path = url.pathname === '/' ? '' : url.pathname;
            return {
                authorizationServers: sources.filter((s) => s.type === 'oauth2').map((s) => s.issuer),
                challenge: `Bearer resource_metadata="${url.origin}/.well-known/oauth-protected-resource${path}"`,
            };
        }
        catch (error) {
            this.logger.warn('Failed to advertise resource', { error });
            return {};
        }
    }
};
exports.Oauth2BearerDriver = Oauth2BearerDriver;
exports.Oauth2BearerDriver = Oauth2BearerDriver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [inbound_auth_1.TrustedSourceStore, inbound_auth_1.LocalAuthorizationServer, backend_common_1.Logger])
], Oauth2BearerDriver);
//# sourceMappingURL=oauth2-bearer.driver.js.map