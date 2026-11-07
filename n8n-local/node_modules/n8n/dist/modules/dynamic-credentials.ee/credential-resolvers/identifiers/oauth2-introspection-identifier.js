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
exports.OAuth2TokenIntrospectionIdentifier = exports.TokenIntrospectionResponseSchema = exports.OAuth2IntrospectionOptionsSchema = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const zod_1 = require("zod");
const identifier_interface_1 = require("./identifier-interface");
const oauth2_metadata_http_client_1 = require("./oauth2-metadata-http-client");
const oauth2_utils_1 = require("./oauth2-utils");
const backend_services_1 = require("@n8n/backend-services");
const MAX_TOKEN_CACHE_TIMEOUT = 5 * constants_1.Time.minutes.toMilliseconds;
const DEFAULT_CACHE_TIMEOUT = 60 * constants_1.Time.seconds.toMilliseconds;
exports.OAuth2IntrospectionOptionsSchema = zod_1.z.object({
    ...oauth2_utils_1.OAuth2OptionsSchema.shape,
    validation: zod_1.z.literal('oauth2-introspection'),
    clientId: zod_1.z.string().trim().min(1, 'Client ID is required'),
    clientSecret: zod_1.z.string().trim().min(1, 'Client Secret is required'),
});
const OAuth2MetadataSchema = zod_1.z.object({
    issuer: zod_1.z.string().url(),
    introspection_endpoint: zod_1.z.string().url(),
    introspection_endpoint_auth_methods_supported: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.TokenIntrospectionResponseSchema = zod_1.z
    .object({
    active: zod_1.z.boolean(),
    scope: zod_1.z.string().optional(),
    client_id: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
    token_type: zod_1.z.string().optional(),
    exp: zod_1.z.number().int().optional(),
    iat: zod_1.z.number().int().optional(),
    nbf: zod_1.z.number().int().optional(),
    sub: zod_1.z.string().optional(),
    aud: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    iss: zod_1.z.string().optional(),
    jti: zod_1.z.string().optional(),
})
    .passthrough();
const CACHE_PREFIX = 'oauth2-introspection-identifier';
let OAuth2TokenIntrospectionIdentifier = class OAuth2TokenIntrospectionIdentifier {
    constructor(logger, cache, http) {
        this.logger = logger;
        this.cache = cache;
        this.http = http;
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
        if (!metadata.introspection_endpoint) {
            this.logger.error('Metadata does not contain an introspection endpoint');
            throw new identifier_interface_1.IdentifierValidationError('Metadata does not contain an introspection endpoint');
        }
        if (metadata.introspection_endpoint_auth_methods_supported) {
            const supportedMethods = metadata.introspection_endpoint_auth_methods_supported;
            if (!supportedMethods.includes('client_secret_basic') &&
                !supportedMethods.includes('client_secret_post')) {
                this.logger.error('No supported client authentication method for introspection endpoint, supported options are client_secret_basic and client_secret_post');
                throw new identifier_interface_1.IdentifierValidationError('No supported client authentication method for introspection endpoint, supported options are client_secret_basic and client_secret_post');
            }
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
        const { subject, ttl: ttlOverwrite } = await this.resolveBasedOnTokenIntrospection(metadata, options, context);
        const ttl = ttlOverwrite ?? DEFAULT_CACHE_TIMEOUT;
        if (ttl > 0) {
            await this.cache.set(identifierCacheKey, subject, ttl);
        }
        return subject;
    }
    parseOptions(options) {
        try {
            return exports.OAuth2IntrospectionOptionsSchema.parse(options);
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
    buildClientBasicRequest(options) {
        const authHeaders = {};
        const authParams = {};
        const credentials = Buffer.from(`${encodeURIComponent(options.clientId)}:${encodeURIComponent(options.clientSecret)}`).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        return { headers: authHeaders, params: authParams };
    }
    buildClientPostRequest(options) {
        const authHeaders = {};
        const authParams = {};
        authParams['client_id'] = options.clientId;
        authParams['client_secret'] = options.clientSecret;
        return { headers: authHeaders, params: authParams };
    }
    parseIntrospectionResponse(data) {
        try {
            return exports.TokenIntrospectionResponseSchema.parse(data);
        }
        catch (error) {
            this.logger.error('Invalid token introspection response format', { error });
            throw new identifier_interface_1.IdentifierValidationError('Invalid token introspection response format');
        }
    }
    async resolveBasedOnTokenIntrospection(metadata, options, context) {
        const supportedMethods = metadata.introspection_endpoint_auth_methods_supported;
        const useBasic = !supportedMethods || supportedMethods.includes('client_secret_basic');
        const usePost = !useBasic && supportedMethods?.includes('client_secret_post');
        let authHeaders = {};
        let authParams = {};
        if (useBasic) {
            const result = this.buildClientBasicRequest(options);
            authHeaders = result.headers;
            authParams = result.params;
        }
        else if (usePost) {
            const result = this.buildClientPostRequest(options);
            authHeaders = result.headers;
            authParams = result.params;
        }
        else {
            this.logger.error('No supported client authentication method for introspection endpoint');
            throw new identifier_interface_1.IdentifierValidationError('No supported client authentication method for introspection endpoint');
        }
        const params = new URLSearchParams({
            token: context.identity,
            ...authParams,
        });
        const response = await this.http.requestFull({
            url: metadata.introspection_endpoint,
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...authHeaders },
            json: true,
        });
        if (response.statusCode !== 200) {
            this.logger.error('Token introspection failed', {
                status: response.statusCode,
                data: response.body,
            });
            throw new identifier_interface_1.IdentifierValidationError('Token introspection failed');
        }
        const introspectionData = this.parseIntrospectionResponse(response.body);
        if (!introspectionData.active) {
            this.logger.error('Token is not active according to introspection response');
            throw new identifier_interface_1.IdentifierValidationError('Token is not active');
        }
        if (options.expectedAudience) {
            (0, oauth2_utils_1.assertAudience)(introspectionData, options.expectedAudience);
        }
        else {
            this.logger.warn('OAuth2 resolver has no expected audience configured, so access tokens are not bound to this instance. Set an expected audience on the resolver.', { issuer: metadata.issuer });
        }
        const subject = introspectionData[options.subjectClaim];
        if (!subject) {
            this.logger.error(`Token introspection response missing subject claim (${options.subjectClaim})`);
            throw new identifier_interface_1.IdentifierValidationError(`Token introspection response missing subject claim (${options.subjectClaim})`);
        }
        const subjectStr = String(subject);
        this.logger.debug('Token introspected successfully', { subject: subjectStr });
        const ttl = introspectionData.exp === undefined
            ? undefined
            : Math.min(Math.max(introspectionData.exp * 1000 - Date.now(), 0), MAX_TOKEN_CACHE_TIMEOUT);
        return { subject: subjectStr, ttl };
    }
};
exports.OAuth2TokenIntrospectionIdentifier = OAuth2TokenIntrospectionIdentifier;
exports.OAuth2TokenIntrospectionIdentifier = OAuth2TokenIntrospectionIdentifier = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.CacheService, oauth2_metadata_http_client_1.OAuth2MetadataHttpClient])
], OAuth2TokenIntrospectionIdentifier);
//# sourceMappingURL=oauth2-introspection-identifier.js.map