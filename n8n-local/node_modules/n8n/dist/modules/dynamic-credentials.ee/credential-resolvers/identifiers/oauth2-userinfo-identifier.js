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
exports.OAuth2UserInfoIdentifier = exports.UserInfoResponseSchema = exports.OAuth2UserInfoOptionsSchema = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const backend_services_1 = require("@n8n/backend-services");
const identifier_interface_1 = require("./identifier-interface");
const oauth2_metadata_http_client_1 = require("./oauth2-metadata-http-client");
const oauth2_utils_1 = require("./oauth2-utils");
const MAX_TOKEN_CACHE_TIMEOUT = 5 * constants_1.Time.minutes.toMilliseconds;
const DEFAULT_CACHE_TIMEOUT = 60 * constants_1.Time.seconds.toMilliseconds;
exports.OAuth2UserInfoOptionsSchema = zod_1.z.object({
    ...oauth2_utils_1.OAuth2OptionsSchema.shape,
    validation: zod_1.z.literal('oauth2-userinfo'),
});
const OAuth2MetadataSchema = zod_1.z.object({
    issuer: zod_1.z.string().url(),
    userinfo_endpoint: zod_1.z.string().url(),
    jwks_uri: zod_1.z.string().url().optional(),
});
const JWKS_REFRESH_COOLDOWN = 30 * constants_1.Time.seconds.toMilliseconds;
function isNoMatchingKeyError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ERR_JWKS_NO_MATCHING_KEY');
}
function isJwks(value) {
    return (typeof value === 'object' && value !== null && 'keys' in value && Array.isArray(value.keys));
}
const JwksSchema = zod_1.z.custom(isJwks, { message: 'Invalid JWKS format' });
exports.UserInfoResponseSchema = zod_1.z
    .object({
    sub: zod_1.z.string().optional(),
})
    .passthrough();
const CACHE_PREFIX = 'oauth2-userinfo-identifier';
let OAuth2UserInfoIdentifier = class OAuth2UserInfoIdentifier {
    constructor(logger, cache, http) {
        this.logger = logger;
        this.cache = cache;
        this.http = http;
        this.jwksRefreshes = new Map();
    }
    async validateOptions(identifierOptions) {
        const options = this.parseOptions(identifierOptions);
        let metadata;
        try {
            metadata = await this.fetchMetadata(options, true);
        }
        catch (error) {
            if (error instanceof identifier_interface_1.IdentifierValidationError) {
                throw error;
            }
            this.logger.error(`Failed to reach OAuth2 metadata URL ${options.metadataUri}`, {
                error,
            });
            throw new identifier_interface_1.IdentifierValidationError(`Could not reach metadata URL: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
        if (!metadata.userinfo_endpoint) {
            this.logger.error('Metadata does not contain an userinfo endpoint');
            throw new identifier_interface_1.IdentifierValidationError('Metadata does not contain an userinfo endpoint');
        }
        if (options.expectedAudience && !metadata.jwks_uri) {
            this.logger.error('Metadata does not contain a JWKS endpoint');
            throw new identifier_interface_1.IdentifierValidationError('Metadata does not contain a JWKS endpoint, which is required to verify access tokens');
        }
    }
    async resolve(context, identifierOptions) {
        const options = this.parseOptions(identifierOptions);
        const metadata = await this.fetchMetadata(options);
        const hashedToken = (0, oauth2_utils_1.sha256)(context.identity);
        const optionsFingerprint = (0, oauth2_utils_1.sha256)(`${options.subjectClaim}:${options.expectedAudience ?? ''}`);
        const identifierCacheKey = `${CACHE_PREFIX}:subject:${metadata.issuer}:${optionsFingerprint}:${hashedToken}`;
        const cached = await this.cache.get(identifierCacheKey);
        if (cached) {
            return cached;
        }
        const { subject, ttl: ttlOverwrite } = await this.resolveSubject(metadata, options, context);
        const ttl = ttlOverwrite ?? DEFAULT_CACHE_TIMEOUT;
        if (ttl > 0) {
            await this.cache.set(identifierCacheKey, subject, ttl);
        }
        return subject;
    }
    parseOptions(options) {
        try {
            return exports.OAuth2UserInfoOptionsSchema.parse(options);
        }
        catch (error) {
            this.logger.error('Invalid OAuth2 identifier options', { error });
            throw new identifier_interface_1.IdentifierValidationError('Invalid OAuth2 identifier options', {
                cause: error,
            });
        }
    }
    async fetchMetadata(options, skipCache = false) {
        return await this.http.fetchMetadata(OAuth2MetadataSchema, {
            metadataUri: options.metadataUri,
            cachePrefix: CACHE_PREFIX,
            skipCache,
        });
    }
    parseUserInfoResponse(data) {
        try {
            return exports.UserInfoResponseSchema.parse(data);
        }
        catch (error) {
            this.logger.error('Invalid userinfo response format', { error });
            throw new identifier_interface_1.IdentifierValidationError('Invalid userinfo response format');
        }
    }
    async resolveSubject(metadata, options, context) {
        if (!options.expectedAudience) {
            this.logger.warn('OAuth2 resolver has no expected audience configured, so access tokens are not bound to this instance. Set an expected audience on the resolver.', { issuer: metadata.issuer });
            return await this.resolveBasedOnUserInfo(metadata, options, context);
        }
        const claims = await this.verifyAccessToken(metadata, context.identity, options.expectedAudience);
        const ttl = this.cacheTtlFor(claims.exp);
        const tokenSubject = claims[options.subjectClaim];
        if (typeof tokenSubject === 'string' && tokenSubject !== '') {
            this.logger.debug('Resolved subject from access token', { subject: tokenSubject });
            return { subject: tokenSubject, ttl };
        }
        const userData = await this.queryUserInfo(metadata, context);
        if (claims.sub && userData.sub && claims.sub !== userData.sub) {
            this.logger.error('UserInfo subject does not match the verified access token');
            throw new identifier_interface_1.IdentifierValidationError('UserInfo subject does not match the verified access token');
        }
        return { subject: this.extractSubject(userData, options), ttl };
    }
    async verifyAccessToken(metadata, token, expectedAudience) {
        if (token.split('.').length !== 3) {
            throw new identifier_interface_1.IdentifierValidationError('Access token is not a JWT, so its audience cannot be verified. Use the token introspection validation method with this provider.');
        }
        if (!metadata.jwks_uri) {
            throw new identifier_interface_1.IdentifierValidationError('Metadata does not contain a JWKS endpoint, which is required to verify access tokens');
        }
        const { createLocalJWKSet, jwtVerify } = await import('jose');
        const verify = async (jwks) => await jwtVerify(token, createLocalJWKSet(jwks), { issuer: metadata.issuer });
        let payload;
        try {
            payload = (await verify(await this.fetchJwks(metadata.jwks_uri))).payload;
        }
        catch (error) {
            let refreshed;
            if (isNoMatchingKeyError(error)) {
                try {
                    refreshed = await this.refreshJwks(metadata.jwks_uri);
                }
                catch (refreshError) {
                    this.logger.error('Failed to refresh the key set', { error: refreshError });
                    throw new identifier_interface_1.IdentifierValidationError('Access token verification failed', {
                        cause: refreshError,
                    });
                }
            }
            if (!refreshed) {
                this.logger.error('Access token verification failed', { error });
                throw new identifier_interface_1.IdentifierValidationError('Access token verification failed', { cause: error });
            }
            try {
                payload = (await verify(refreshed)).payload;
            }
            catch (retryError) {
                this.logger.error('Access token verification failed', { error: retryError });
                throw new identifier_interface_1.IdentifierValidationError('Access token verification failed', {
                    cause: retryError,
                });
            }
            this.logger.debug('Verified access token after refreshing the key set', {
                issuer: metadata.issuer,
            });
        }
        (0, oauth2_utils_1.assertAudience)(payload, expectedAudience);
        return payload;
    }
    async fetchJwks(jwksUri, forceRefresh = false) {
        return await this.http.fetchMetadata(JwksSchema, {
            metadataUri: jwksUri,
            cachePrefix: `${CACHE_PREFIX}:jwks`,
            skipCache: false,
            forceRefresh,
        });
    }
    async refreshJwks(jwksUri) {
        const inFlight = this.jwksRefreshes.get(jwksUri);
        if (inFlight) {
            return await inFlight;
        }
        const refresh = this.claimAndFetchJwks(jwksUri);
        this.jwksRefreshes.set(jwksUri, refresh);
        try {
            return await refresh;
        }
        finally {
            this.jwksRefreshes.delete(jwksUri);
        }
    }
    async claimAndFetchJwks(jwksUri) {
        const cooldownKey = `${CACHE_PREFIX}:jwks-refresh:${jwksUri}`;
        if (await this.cache.get(cooldownKey)) {
            return undefined;
        }
        await this.cache.set(cooldownKey, true, JWKS_REFRESH_COOLDOWN);
        return await this.fetchJwks(jwksUri, true);
    }
    async queryUserInfo(metadata, context) {
        const response = await this.http.requestFull({
            url: metadata.userinfo_endpoint,
            method: 'GET',
            headers: { authorization: `Bearer ${context.identity}` },
            json: true,
        });
        if (response.statusCode !== 200) {
            this.logger.error('UserInfo failed', {
                status: response.statusCode,
                data: response.body,
            });
            throw new identifier_interface_1.IdentifierValidationError('UserInfo query failed');
        }
        return this.parseUserInfoResponse(response.body);
    }
    extractSubject(userData, options) {
        const subject = userData[options.subjectClaim];
        if (!subject) {
            this.logger.error(`UserInfo response missing subject claim (${options.subjectClaim})`);
            throw new identifier_interface_1.IdentifierValidationError(`UserInfo response missing subject claim (${options.subjectClaim})`);
        }
        const subjectStr = String(subject);
        this.logger.debug('UserInfo successfully', { subject: subjectStr });
        return subjectStr;
    }
    cacheTtlFor(exp) {
        if (typeof exp !== 'number') {
            return undefined;
        }
        return Math.min(Math.max(exp * 1000 - Date.now(), 0), MAX_TOKEN_CACHE_TIMEOUT);
    }
    async resolveBasedOnUserInfo(metadata, options, context) {
        const userData = await this.queryUserInfo(metadata, context);
        return {
            subject: this.extractSubject(userData, options),
            ttl: this.cacheTtlFor(userData.exp),
        };
    }
};
exports.OAuth2UserInfoIdentifier = OAuth2UserInfoIdentifier;
exports.OAuth2UserInfoIdentifier = OAuth2UserInfoIdentifier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.CacheService, oauth2_metadata_http_client_1.OAuth2MetadataHttpClient])
], OAuth2UserInfoIdentifier);
//# sourceMappingURL=oauth2-userinfo-identifier.js.map