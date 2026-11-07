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
exports.OAuthTokenService = void 0;
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const jsonwebtoken_1 = require("jsonwebtoken");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const grant_authorization_1 = require("../../modules/inbound-auth-core/grant-authorization");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const workflow_finder_service_1 = require("../../workflows/workflow-finder.service");
const oauth_access_token_repository_1 = require("./database/repositories/oauth-access-token.repository");
const oauth_refresh_token_repository_1 = require("./database/repositories/oauth-refresh-token.repository");
const oauth_signing_key_constants_1 = require("./oauth-signing-key.constants");
const oauth_signing_key_service_1 = require("./oauth-signing-key.service");
const oauth_errors_1 = require("./oauth.errors");
const resource_identity_1 = require("./resource-identity");
const oauth_grant_service_1 = require("./oauth-grant.service");
let OAuthTokenService = class OAuthTokenService {
    constructor(logger, jwtService, userRepository, accessTokenRepository, refreshTokenRepository, resourceRegistry, workflowFinderService, urlService, signingKeyService, grantService) {
        this.logger = logger;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.accessTokenRepository = accessTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.resourceRegistry = resourceRegistry;
        this.workflowFinderService = workflowFinderService;
        this.urlService = urlService;
        this.signingKeyService = signingKeyService;
        this.grantService = grantService;
        this.ACCESS_TOKEN_EXPIRY_SECONDS = oauth_signing_key_constants_1.OAUTH_ACCESS_TOKEN_TTL_SECONDS;
        this.REFRESH_TOKEN_EXPIRY_MS = 30 * constants_1.Time.days.toMilliseconds;
    }
    getAccessTokenExpirySeconds() {
        return this.ACCESS_TOKEN_EXPIRY_SECONDS;
    }
    generateTokenPair(userId, clientId, resource, scopes) {
        const audience = resource ?? this.resourceRegistry.getDefaultResource()?.getResourceUrl();
        if (!audience) {
            throw new n8n_workflow_1.UnexpectedError('Cannot mint an OAuth access token: no resource requested and no default protected resource is registered');
        }
        const accessToken = this.signingKeyService.signAccessToken({
            iss: this.urlService.getInstanceBaseUrl(),
            sub: userId,
            client_id: clientId,
            jti: (0, node_crypto_1.randomUUID)(),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.ACCESS_TOKEN_EXPIRY_SECONDS,
            scope: scopes.join(' '),
            meta: {
                isOAuth: true,
            },
        }, audience);
        const refreshToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        return { accessToken, refreshToken, audience };
    }
    async saveTokenPair(accessToken, refreshToken, clientId, userId, scopes, resource, ctx = {}) {
        await this.grantService.runForActiveUser(userId, async (ctx) => {
            await this.accessTokenRepository.insertToken({ token: accessToken, clientId, userId }, ctx);
            await this.refreshTokenRepository.insertToken({
                token: refreshToken,
                clientId,
                userId,
                expiresAt: Date.now() + this.REFRESH_TOKEN_EXPIRY_MS,
                scope: scopes,
                resource,
            }, ctx);
        }, ctx);
    }
    async validateAndRotateRefreshToken(refreshToken, clientId, resource) {
        const refreshTokenRecord = await this.refreshTokenRepository.findByToken(refreshToken, clientId, {});
        if (!refreshTokenRecord) {
            throw new errors_js_1.InvalidGrantError('Invalid refresh token');
        }
        const grantedResource = refreshTokenRecord.resource;
        if (resource &&
            !(await (0, resource_identity_1.isSameProtectedResource)(this.resourceRegistry, resource, grantedResource))) {
            this.logger.warn('Refresh token request denied: resource is outside the grant', {
                clientId,
                userId: refreshTokenRecord.userId,
            });
            throw new errors_js_1.InvalidTargetError('Requested resource is not part of this grant');
        }
        return await this.grantService.runForActiveUser(refreshTokenRecord.userId, async (ctx) => {
            const now = Date.now();
            const numAffected = await this.refreshTokenRepository.deleteValidByToken(refreshToken, clientId, now, ctx);
            if (numAffected < 1) {
                throw new errors_js_1.InvalidGrantError('Invalid refresh token');
            }
            const scopes = refreshTokenRecord.scope;
            const { accessToken, refreshToken: newRefreshToken } = this.generateTokenPair(refreshTokenRecord.userId, clientId, grantedResource, scopes);
            await this.accessTokenRepository.insertToken({ token: accessToken, clientId, userId: refreshTokenRecord.userId }, ctx);
            await this.refreshTokenRepository.insertToken({
                token: newRefreshToken,
                clientId,
                userId: refreshTokenRecord.userId,
                expiresAt: now + this.REFRESH_TOKEN_EXPIRY_MS,
                scope: scopes,
                resource: grantedResource,
            }, ctx);
            this.logger.info('Refresh token rotated and new access token issued', {
                clientId,
                userId: refreshTokenRecord.userId,
            });
            return {
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: this.ACCESS_TOKEN_EXPIRY_SECONDS,
                refresh_token: newRefreshToken,
                scope: scopes.join(' '),
            };
        });
    }
    async verifyAccessToken(token, expectedAudience) {
        return await this.verifyTokenWithAudiences(token, await this.getAllowedAudiences(expectedAudience));
    }
    async verifyTokenWithAudiences(token, allowedAudiences) {
        let decoded;
        try {
            decoded = await this.verifyJwt(token, allowedAudiences);
        }
        catch (error) {
            this.logger.debug('OAuth access token failed verification', {
                error: (0, ensure_error_1.ensureError)(error).message,
            });
            throw new oauth_errors_1.JWTVerificationError();
        }
        const clientId = this.getStringClaim(decoded, 'client_id');
        const userId = this.getStringClaim(decoded, 'sub');
        if (!clientId || !userId) {
            throw new oauth_errors_1.JWTVerificationError();
        }
        const accessTokenRecord = await this.accessTokenRepository.findOne({
            where: { token },
        });
        if (!accessTokenRecord) {
            throw new oauth_errors_1.AccessTokenNotFoundError();
        }
        return {
            token,
            clientId,
            scopes: this.parseScopeClaim(decoded),
            extra: {
                userId,
            },
        };
    }
    parseScopeClaim(decoded) {
        const scopeClaim = this.getStringClaim(decoded, 'scope');
        if (scopeClaim === null) {
            return [];
        }
        return scopeClaim === '' ? [] : scopeClaim.split(' ');
    }
    async verifyOAuthAccessToken(token, expectedAudience, grant) {
        try {
            const resource = await this.getResourceByAudience(expectedAudience);
            if (expectedAudience && !resource && !grant) {
                return { user: null, context: { reason: 'insufficient_scope', auth_type: 'oauth' } };
            }
            const authInfo = await this.verifyTokenWithAudiences(token, resource || !grant
                ? this.audiencesForResource(resource, expectedAudience)
                : grant.audiences);
            const userId = authInfo.extra && typeof authInfo.extra === 'object'
                ? this.getStringClaim(authInfo.extra, 'userId')
                : null;
            if (!userId) {
                return { user: null, context: { reason: 'user_id_not_in_auth_info', auth_type: 'oauth' } };
            }
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['role'],
            });
            if (!user) {
                return { user: null, context: { reason: 'user_not_found', auth_type: 'oauth' } };
            }
            if (user.disabled) {
                return { user: null, context: { reason: 'user_disabled', auth_type: 'oauth' } };
            }
            if (!(await this.isAuthorized(user, resource, grant))) {
                this.logger.warn('OAuth token denied: user lacks execute access', {
                    userId: user.id,
                    expectedAudience,
                });
                return { user: null, context: { reason: 'insufficient_scope', auth_type: 'oauth' } };
            }
            return {
                user,
                caller: { authType: 'oauth', clientId: authInfo.clientId },
                scopes: authInfo.scopes,
                grant: resource?.getGrant?.(),
            };
        }
        catch (error) {
            const errorForSure = (0, ensure_error_1.ensureError)(error);
            const reason = errorForSure instanceof oauth_errors_1.JWTVerificationError
                ? 'invalid_token'
                : errorForSure instanceof oauth_errors_1.AccessTokenNotFoundError
                    ? 'token_not_found_in_db'
                    : 'unknown_error';
            return {
                user: null,
                context: {
                    reason,
                    auth_type: 'oauth',
                    error_details: errorForSure.message,
                },
            };
        }
    }
    async revokeAllTokensForGrant(clientId, userId) {
        await Promise.all([
            this.accessTokenRepository.delete({ clientId, userId }),
            this.refreshTokenRepository.delete({ clientId, userId }),
        ]);
    }
    async revokeAccessToken(token, clientId) {
        const result = await this.accessTokenRepository.delete({
            token,
            clientId,
        });
        const revoked = (result.affected ?? 0) > 0;
        if (revoked) {
            this.logger.info('Access token revoked', { clientId });
        }
        return revoked;
    }
    async revokeRefreshToken(token, clientId) {
        const result = await this.refreshTokenRepository.delete({
            token,
            clientId,
        });
        const revoked = (result.affected ?? 0) > 0;
        if (revoked) {
            this.logger.info('Refresh token revoked', { clientId });
        }
        return revoked;
    }
    async getAllowedAudiences(expectedAudience) {
        const resource = expectedAudience
            ? await this.resourceRegistry.getByResourceUrl(expectedAudience)
            : undefined;
        return this.audiencesForResource(resource, expectedAudience);
    }
    audiencesForResource(resource, expectedAudience) {
        if (expectedAudience) {
            return resource ? resource.getAudiences() : [expectedAudience];
        }
        return this.resourceRegistry.getAllAudiences();
    }
    async isAuthorized(user, resource, grant) {
        if (resource)
            return await resource.authorize(user);
        if (!grant)
            return true;
        return await (0, grant_authorization_1.authorizeAgainstGrant)(this.workflowFinderService, grant, user);
    }
    async getResourceByAudience(expectedAudience) {
        if (!expectedAudience) {
            return this.resourceRegistry.getDefaultResource();
        }
        return await this.resourceRegistry.getByResourceUrl(expectedAudience);
    }
    async verifyJwt(token, audiences) {
        const decoded = this.jwtService.decodeUnverifiedWithHeader(token);
        if (!decoded) {
            throw new jsonwebtoken_1.JsonWebTokenError('jwt malformed');
        }
        if (Object.hasOwn(decoded.header, 'kid')) {
            return await this.signingKeyService.verifyAccessToken(token, {
                kid: decoded.header.kid,
                audiences,
                issuer: this.urlService.getInstanceBaseUrl(),
            });
        }
        return this.verifyLegacyHmacJwt(token, audiences);
    }
    verifyLegacyHmacJwt(token, audiences) {
        try {
            return this.jwtService.verifyLegacyHmacAccessToken(token, audiences);
        }
        catch (error) {
            for (const audience of audiences) {
                try {
                    return this.jwtService.verifyLegacyHmacAccessToken(token, audience);
                }
                catch {
                    continue;
                }
            }
            throw error;
        }
    }
    getStringClaim(payload, claim) {
        if (!payload || typeof payload !== 'object')
            return null;
        const claimValue = payload[claim];
        return typeof claimValue === 'string' ? claimValue : null;
    }
};
exports.OAuthTokenService = OAuthTokenService;
exports.OAuthTokenService = OAuthTokenService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.JwtService, db_1.UserRepository, oauth_access_token_repository_1.AccessTokenRepository, oauth_refresh_token_repository_1.RefreshTokenRepository, auth_1.ProtectedResourceRegistry, workflow_finder_service_1.WorkflowFinderService, backend_services_1.UrlService, oauth_signing_key_service_1.OAuthSigningKeyService, oauth_grant_service_1.OAuthGrantService])
], OAuthTokenService);
//# sourceMappingURL=oauth-token.service.js.map