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
exports.OAuthController = void 0;
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const authorize_js_1 = require("@modelcontextprotocol/sdk/server/auth/handlers/authorize.js");
const register_js_1 = require("@modelcontextprotocol/sdk/server/auth/handlers/register.js");
const revoke_js_1 = require("@modelcontextprotocol/sdk/server/auth/handlers/revoke.js");
const token_js_1 = require("@modelcontextprotocol/sdk/server/auth/handlers/token.js");
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const is_record_1 = require("@n8n/utils/is-record");
const v4_1 = require("zod/v4");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const oauth_local_authorization_server_1 = require("./oauth-local-authorization-server");
const oauth_server_config_1 = require("./oauth-server.config");
const oauth_server_service_1 = require("./oauth-server.service");
const oauth_errors_1 = require("./oauth.errors");
const oauth_helpers_1 = require("./oauth.helpers");
const oauthServerService = di_1.Container.get(oauth_server_service_1.OAuthServerService);
const globalConfig = di_1.Container.get(config_1.GlobalConfig);
const oauthServerConfig = di_1.Container.get(oauth_server_config_1.OAuthServerConfig);
const logger = di_1.Container.get(backend_common_1.Logger);
const urlService = di_1.Container.get(backend_services_1.UrlService);
const oauthClientLimitGuard = async (_req, res, next) => {
    if (await oauthServerService.isClientLimitReached()) {
        const limit = globalConfig.endpoints.mcpMaxRegisteredClients;
        logger.warn('OAuth client registration rejected: instance limit reached (pre-check)', {
            limit,
        });
        res.status(503).json({
            error: 'server_error',
            error_description: (0, oauth_errors_1.buildOAuthClientLimitReachedMessage)(limit),
        });
        return;
    }
    next();
};
const authorizationRequestParamsSchema = v4_1.z.object({
    response_type: v4_1.z.literal('code'),
    code_challenge: v4_1.z.string(),
    code_challenge_method: v4_1.z.literal('S256'),
    scope: v4_1.z.string().optional(),
    state: v4_1.z.string().optional(),
    resource: v4_1.z.url().optional(),
});
const authorizationRequestValidator = (req, res, next) => {
    const result = authorizationRequestParamsSchema.safeParse(req.method === 'POST' ? req.body : req.query);
    if (result.success) {
        next();
        return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json(new errors_js_1.InvalidRequestError(result.error.message).toResponseObject());
};
const rfc9207IssuerParam = (_req, res, next) => {
    const originalLocation = res.location.bind(res);
    res.location = (url) => originalLocation(oauth_helpers_1.OAuthHelpers.setIssuerParam(url, urlService.getInstanceBaseUrl()));
    next();
};
const logTokenFailures = (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode >= 400) {
            const errorBody = (0, is_record_1.isRecord)(body) ? body : {};
            const requestBody = (0, is_record_1.isRecord)(req.body) ? req.body : {};
            const clientId = typeof requestBody.client_id === 'string'
                ? requestBody.client_id
                : oauth_helpers_1.OAuthHelpers.basicAuthClientId(req.headers.authorization);
            logger.warn('OAuth token request failed', {
                statusCode: res.statusCode,
                error: errorBody.error,
                errorDescription: errorBody.error_description,
                grantType: requestBody.grant_type,
                clientId,
            });
        }
        return originalJson(body);
    };
    next();
};
const registerRouter = (0, register_js_1.clientRegistrationHandler)({
    clientsStore: oauthServerService.clientsStore,
    rateLimit: false,
});
const authorizeRouter = (0, authorize_js_1.authorizationHandler)({
    provider: oauthServerService,
    rateLimit: false,
});
const tokenRouter = (0, token_js_1.tokenHandler)({ provider: oauthServerService, rateLimit: false });
const revokeRouter = (0, revoke_js_1.revocationHandler)({
    provider: oauthServerService,
    rateLimit: false,
});
const sharedEndpointRouters = (basePath) => [
    {
        path: `${basePath}/register`,
        router: registerRouter,
        skipAuth: true,
        middlewares: [oauthClientLimitGuard],
        ipRateLimit: (0, decorators_1.createIpRateLimit)(oauthServerConfig.rateLimitRegister, 5 * constants_1.Time.minutes.toMilliseconds),
    },
    {
        path: `${basePath}/authorize`,
        router: authorizeRouter,
        skipAuth: true,
        middlewares: [authorizationRequestValidator, rfc9207IssuerParam],
        ipRateLimit: (0, decorators_1.createIpRateLimit)(oauthServerConfig.rateLimitAuthorize, 5 * constants_1.Time.minutes.toMilliseconds),
    },
    {
        path: `${basePath}/token`,
        router: tokenRouter,
        skipAuth: true,
        middlewares: [logTokenFailures],
        ipRateLimit: (0, decorators_1.createIpRateLimit)(oauthServerConfig.rateLimitToken, 5 * constants_1.Time.minutes.toMilliseconds),
    },
    {
        path: `${basePath}/revoke`,
        router: revokeRouter,
        skipAuth: true,
        ipRateLimit: (0, decorators_1.createIpRateLimit)(oauthServerConfig.rateLimitRevoke, 5 * constants_1.Time.minutes.toMilliseconds),
    },
];
const discoverableResource = async (resource) => resource && ((await resource.isAvailable?.()) ?? true) ? resource : undefined;
const wellKnownIpRateLimit = (0, decorators_1.createIpRateLimit)(oauthServerConfig.rateLimitWellKnown, 5 * constants_1.Time.minutes.toMilliseconds);
let OAuthController = class OAuthController {
    constructor(urlService, resourceRegistry, localServer, authenticationService) {
        this.urlService = urlService;
        this.resourceRegistry = resourceRegistry;
        this.localServer = localServer;
        this.authenticationService = authenticationService;
    }
    setCorsHeaders(res) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    metadataOptions(_req, res) {
        this.setCorsHeaders(res);
        res.status(204).end();
    }
    async metadata(_req, res) {
        this.setCorsHeaders(res);
        res.json(await this.localServer.getMetadata());
    }
    pathInsertedMetadataOptions(_req, res) {
        this.setCorsHeaders(res);
        res.status(204).end();
    }
    pathInsertedMetadata(_req, res) {
        this.setCorsHeaders(res);
        res.status(404).json({ message: 'Unknown authorization server' });
    }
    protectedResourceMetadataOptions(_req, res) {
        this.setCorsHeaders(res);
        res.status(204).end();
    }
    async protectedResourceMetadata(req, res) {
        this.setCorsHeaders(res);
        const resourcePath = '/' +
            (Array.isArray(req.params.resourcePath)
                ? req.params.resourcePath.join('/')
                : req.params.resourcePath);
        const queryStart = req.originalUrl?.indexOf('?') ?? -1;
        const search = queryStart === -1 ? '' : req.originalUrl.slice(queryStart);
        const resource = await discoverableResource(await this.resourceRegistry.getByResourcePath(resourcePath + search));
        if (!resource) {
            res.status(404).json({ message: 'Unknown protected resource' });
            return;
        }
        res.json(await this.buildProtectedResourceMetadata(resource));
    }
    defaultProtectedResourceMetadataOptions(_req, res) {
        this.setCorsHeaders(res);
        res.status(204).end();
    }
    async defaultProtectedResourceMetadata(_req, res) {
        this.setCorsHeaders(res);
        const resource = await discoverableResource(this.resourceRegistry.getDefaultResource());
        if (!resource) {
            res.status(404).json({ message: 'Unknown protected resource' });
            return;
        }
        res.json(await this.buildProtectedResourceMetadata(resource));
    }
    async buildProtectedResourceMetadata(resource) {
        const authorizationServers = resource.surface === 'public-api'
            ? (await this.authenticationService.advertise({
                surface: resource.surface,
                resource: {
                    url: resource.getResourceUrl(),
                    acceptedAudiences: resource.getAudiences(),
                },
            })).authorizationServers
            : [this.urlService.getInstanceBaseUrl()];
        const metadata = {
            resource: resource.getResourceUrl(),
            bearer_methods_supported: ['header'],
            authorization_servers: authorizationServers,
        };
        if (resource.scopes.length > 0) {
            metadata.scopes_supported = resource.scopes;
        }
        return metadata;
    }
};
exports.OAuthController = OAuthController;
OAuthController.routers = [
    ...sharedEndpointRouters('/mcp-oauth'),
    ...sharedEndpointRouters('/oauth'),
];
__decorate([
    (0, decorators_1.Options)('/.well-known/oauth-authorization-server', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "metadataOptions", null);
__decorate([
    (0, decorators_1.Get)('/.well-known/oauth-authorization-server', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "metadata", null);
__decorate([
    (0, decorators_1.Options)('/.well-known/oauth-authorization-server/*issuerPath', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "pathInsertedMetadataOptions", null);
__decorate([
    (0, decorators_1.Get)('/.well-known/oauth-authorization-server/*issuerPath', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "pathInsertedMetadata", null);
__decorate([
    (0, decorators_1.Options)('/.well-known/oauth-protected-resource/*resourcePath', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "protectedResourceMetadataOptions", null);
__decorate([
    (0, decorators_1.Get)('/.well-known/oauth-protected-resource/*resourcePath', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "protectedResourceMetadata", null);
__decorate([
    (0, decorators_1.Options)('/.well-known/oauth-protected-resource', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OAuthController.prototype, "defaultProtectedResourceMetadataOptions", null);
__decorate([
    (0, decorators_1.Get)('/.well-known/oauth-protected-resource', {
        skipAuth: true,
        usesTemplates: true,
        ipRateLimit: wellKnownIpRateLimit,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OAuthController.prototype, "defaultProtectedResourceMetadata", null);
exports.OAuthController = OAuthController = __decorate([
    (0, decorators_1.RootLevelController)('/'),
    __metadata("design:paramtypes", [backend_services_1.UrlService, auth_1.ProtectedResourceRegistry, oauth_local_authorization_server_1.OAuthServerLocalAuthorizationServer, inbound_auth_1.AuthenticationService])
], OAuthController);
//# sourceMappingURL=oauth.controller.js.map