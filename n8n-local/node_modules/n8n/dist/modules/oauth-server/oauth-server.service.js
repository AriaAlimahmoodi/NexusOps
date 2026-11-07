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
exports.OAuthServerService = void 0;
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const auth_service_1 = require("../../auth/auth.service");
const errors_1 = require("@n8n/errors");
const email_1 = require("../../user-management/email");
const oauth_client_entity_1 = require("./database/entities/oauth-client.entity");
const oauth_client_repository_1 = require("./database/repositories/oauth-client.repository");
const oauth_user_consent_repository_1 = require("./database/repositories/oauth-user-consent.repository");
const oauth_authorization_code_service_1 = require("./oauth-authorization-code.service");
const oauth_consent_service_1 = require("./oauth-consent.service");
const oauth_session_service_1 = require("./oauth-session.service");
const oauth_grant_service_1 = require("./oauth-grant.service");
const oauth_token_service_1 = require("./oauth-token.service");
const oauth_errors_1 = require("./oauth.errors");
const resource_identity_1 = require("./resource-identity");
const MAX_REDIRECT_URIS = 10;
const MAX_CLIENT_NAME_LENGTH = 255;
const SUPPORTED_GRANT_TYPES = ['authorization_code', 'refresh_token'];
const SUPPORTED_TOKEN_ENDPOINT_AUTH_METHODS = ['none', 'client_secret_post', 'client_secret_basic'];
function countCodePointsUpTo(value, limit) {
    let count = 0;
    for (const _codePoint of value) {
        count++;
        if (count > limit) {
            break;
        }
    }
    return count;
}
const MAX_GRANT_TYPES = SUPPORTED_GRANT_TYPES.length;
function matchesTypeFilter(name, type) {
    const clientType = (0, api_types_1.getMcpClientType)(name);
    return clientType !== null && api_types_1.MCP_CLIENT_TYPE_FILTER_BUCKETS[type].includes(clientType);
}
function sortOwners(owners) {
    return [...owners].sort((a, b) => {
        const nameA = [a.firstName, a.lastName].filter(Boolean).join(' ') || a.email;
        const nameB = [b.firstName, b.lastName].filter(Boolean).join(' ') || b.email;
        return nameA.localeCompare(nameB);
    });
}
const MAX_REDIRECT_URI_LENGTH = 2048;
let OAuthServerService = class OAuthServerService {
    constructor(logger, globalConfig, oauthSessionService, oauthClientRepository, tokenService, authorizationCodeService, userConsentRepository, resourceRegistry, mailer, urlService, eventService, authService, oauthConsentService, grantService) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.oauthSessionService = oauthSessionService;
        this.oauthClientRepository = oauthClientRepository;
        this.tokenService = tokenService;
        this.authorizationCodeService = authorizationCodeService;
        this.userConsentRepository = userConsentRepository;
        this.resourceRegistry = resourceRegistry;
        this.mailer = mailer;
        this.urlService = urlService;
        this.eventService = eventService;
        this.authService = authService;
        this.oauthConsentService = oauthConsentService;
        this.grantService = grantService;
    }
    get clientsStore() {
        return {
            getClient: async (clientId) => {
                const client = await this.oauthClientRepository.findOneBy({ id: clientId });
                if (!client) {
                    return await this.resolveVirtualClient(clientId);
                }
                if (client.isFirstParty) {
                    const resource = await this.resourceRegistry.getByResourceUrl(clientId);
                    if (!resource?.isFirstParty)
                        return undefined;
                }
                const supportedScopes = this.resourceRegistry.getAllScopes();
                return {
                    client_id: client.id,
                    client_name: client.name,
                    redirect_uris: client.redirectUris,
                    grant_types: client.grantTypes,
                    token_endpoint_auth_method: client.tokenEndpointAuthMethod,
                    ...(client.clientSecret && { client_secret: client.clientSecret }),
                    ...(client.clientSecretExpiresAt && {
                        client_secret_expires_at: client.clientSecretExpiresAt,
                    }),
                    response_types: ['code'],
                    ...(supportedScopes.length > 0 && { scope: supportedScopes.join(' ') }),
                    logo_uri: undefined,
                    tos_uri: undefined,
                };
            },
            registerClient: async (client) => {
                this.validateClientRegistration(client);
                await this.oauthClientRepository.insert({
                    id: client.client_id,
                    name: client.client_name,
                    redirectUris: client.redirect_uris,
                    grantTypes: client.grant_types,
                    clientSecret: client.client_secret ?? null,
                    clientSecretExpiresAt: client.client_secret_expires_at ?? null,
                    tokenEndpointAuthMethod: client.token_endpoint_auth_method ?? 'none',
                    isFirstParty: false,
                });
                await this.enforceClientLimit(client.client_id);
                return client;
            },
        };
    }
    async isClientLimitReached() {
        const clientCount = await this.oauthClientRepository.countBy({ isFirstParty: false });
        return clientCount >= this.globalConfig.endpoints.mcpMaxRegisteredClients;
    }
    async getInstanceClientStats() {
        const count = await this.oauthClientRepository.countBy({ isFirstParty: false });
        const limit = this.globalConfig.endpoints.mcpMaxRegisteredClients;
        return { count, limit, atCapacity: count >= limit };
    }
    async enforceClientLimit(clientId) {
        const clientCount = await this.oauthClientRepository.countBy({ isFirstParty: false });
        const limit = this.globalConfig.endpoints.mcpMaxRegisteredClients;
        if (clientCount > limit) {
            await this.oauthClientRepository.delete({ id: clientId });
            this.logger.warn('OAuth client registration rejected: instance limit reached (post-insert rollback)', { limit, clientCount });
            throw new oauth_errors_1.OAuthClientLimitReachedError(limit);
        }
    }
    async resolveVirtualClient(clientId) {
        if (clientId.length > MAX_REDIRECT_URI_LENGTH || !this.isTriggerResourceClientId(clientId)) {
            return undefined;
        }
        const resource = await this.resourceRegistry.getByResourceUrl(clientId);
        if (!resource?.isFirstParty) {
            return undefined;
        }
        const resourceUrls = resource.getResourceUrls?.() ?? [resource.getResourceUrl()];
        if (!resourceUrls.includes(clientId)) {
            return undefined;
        }
        await this.oauthClientRepository.upsert({
            id: clientId,
            name: resource.displayName ?? clientId,
            redirectUris: [clientId],
            grantTypes: ['authorization_code', 'refresh_token'],
            tokenEndpointAuthMethod: 'none',
            clientSecret: null,
            clientSecretExpiresAt: null,
            isFirstParty: true,
        }, ['id']);
        return {
            client_id: clientId,
            client_name: resource.displayName ?? clientId,
            redirect_uris: [clientId],
            grant_types: ['authorization_code', 'refresh_token'],
            token_endpoint_auth_method: 'none',
            response_types: ['code'],
            logo_uri: undefined,
            tos_uri: undefined,
        };
    }
    isTriggerResourceClientId(clientId) {
        return [this.urlService.getWebhookBaseUrl(), this.urlService.getTestWebhookBaseUrl()]
            .map((base) => (base.endsWith('/') ? base : `${base}/`))
            .some((base) => clientId.startsWith(base));
    }
    validateClientRegistration(client) {
        if (!client.client_name) {
            throw new Error('client_name is required');
        }
        if (countCodePointsUpTo(client.client_name, MAX_CLIENT_NAME_LENGTH) > MAX_CLIENT_NAME_LENGTH) {
            throw new Error(`client_name exceeds maximum length of ${MAX_CLIENT_NAME_LENGTH} characters`);
        }
        if (!client.grant_types || client.grant_types.length === 0) {
            throw new Error('grant_types is required');
        }
        if (client.grant_types.length > MAX_GRANT_TYPES) {
            throw new Error(`grant_types exceeds maximum count of ${MAX_GRANT_TYPES}`);
        }
        for (const grantType of client.grant_types) {
            if (!SUPPORTED_GRANT_TYPES.includes(grantType)) {
                throw new Error('grant_types contains an unsupported value');
            }
        }
        if (!client.redirect_uris || client.redirect_uris.length === 0) {
            throw new Error('redirect_uris is required');
        }
        if (client.redirect_uris.length > MAX_REDIRECT_URIS) {
            throw new Error(`redirect_uris exceeds maximum count of ${MAX_REDIRECT_URIS}`);
        }
        for (const uri of client.redirect_uris) {
            if (uri.length > MAX_REDIRECT_URI_LENGTH) {
                throw new Error(`redirect_uri exceeds maximum length of ${MAX_REDIRECT_URI_LENGTH} characters`);
            }
        }
        if (client.token_endpoint_auth_method !== undefined &&
            !SUPPORTED_TOKEN_ENDPOINT_AUTH_METHODS.includes(client.token_endpoint_auth_method)) {
            throw new Error('token_endpoint_auth_method contains an unsupported value');
        }
    }
    isRedirectUriAllowed(allowedUris, redirectUri) {
        if (allowedUris.includes(redirectUri)) {
            return true;
        }
        let requested;
        try {
            requested = new URL(redirectUri);
        }
        catch {
            return false;
        }
        if (!this.isLoopbackHost(requested.hostname)) {
            return false;
        }
        return allowedUris.some((allowed) => {
            let candidate;
            try {
                candidate = new URL(allowed);
            }
            catch {
                return false;
            }
            return (this.isLoopbackHost(candidate.hostname) &&
                candidate.protocol === requested.protocol &&
                candidate.hostname === requested.hostname &&
                candidate.pathname === requested.pathname);
        });
    }
    isLoopbackHost(hostname) {
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
    }
    async authorize(client, params, res) {
        this.logger.debug('Starting OAuth authorization', { clientId: client.client_id });
        try {
            const resource = await this.resolveAndValidateResourceIndicator(params.resource?.toString());
            const targetResource = resource
                ? await this.resourceRegistry.getByResourceUrl(resource)
                : this.resourceRegistry.getDefaultResource();
            if (targetResource && (await this.isResourceUnavailable(targetResource))) {
                this.logger.warn('OAuth authorization rejected: target resource is unavailable', {
                    clientId: client.client_id,
                    resource: targetResource.getResourceUrl(),
                });
                res.status(400).json({
                    error: 'invalid_target',
                    error_description: 'Resource is not available for authorization',
                });
                return;
            }
            const allowedUris = (await targetResource?.getAllowedRedirectUris?.()) ?? [];
            if (allowedUris.length > 0 && !this.isRedirectUriAllowed(allowedUris, params.redirectUri)) {
                this.logger.warn('MCP OAuth authorization rejected: requested redirect URI is not in the configured allowlist', {
                    clientId: client.client_id,
                    attemptedUri: params.redirectUri,
                });
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'Redirect URI not in allowed list',
                });
                return;
            }
            const supportedScopes = targetResource?.scopes ?? [];
            const requestedScopes = params.scopes?.filter((scope) => supportedScopes.includes(scope));
            const sessionPayload = {
                clientId: client.client_id,
                redirectUri: params.redirectUri,
                codeChallenge: params.codeChallenge,
                state: params.state ?? null,
                resource,
                ...(requestedScopes && requestedScopes.length > 0 && { requestedScopes }),
            };
            const autoApproval = await this.tryAutoApproveConsent(res, sessionPayload, client);
            if (autoApproval) {
                res.redirect(autoApproval.redirectUrl);
                return;
            }
            const flowId = this.oauthSessionService.createSession(res, sessionPayload);
            res.redirect(`/oauth/consent?flow=${flowId}`);
        }
        catch (error) {
            if (error instanceof InvalidResourceIndicatorError) {
                this.logger.warn('Rejecting OAuth authorization request with invalid resource', {
                    clientId: client.client_id,
                    resource: error.resource,
                    expectedResource: error.expectedResource,
                });
                res.status(400).json({
                    error: 'invalid_target',
                    error_description: 'Invalid resource indicator',
                });
                return;
            }
            this.logger.error('Error in authorize method', { error, clientId: client.client_id });
            res.status(500).json({ error: 'server_error', error_description: 'Internal server error' });
        }
    }
    async challengeForAuthorizationCode(client, authorizationCode) {
        return await this.authorizationCodeService.getCodeChallenge(authorizationCode, client.client_id);
    }
    async exchangeAuthorizationCode(client, authorizationCode, _codeVerifier, redirectUri, resource) {
        const authRecord = await this.authorizationCodeService.findAuthorizationCode(authorizationCode, client.client_id, redirectUri);
        if (!authRecord) {
            throw new errors_js_1.InvalidGrantError('Invalid authorization code');
        }
        const resourceStr = resource?.toString();
        const tokenResource = await this.resolveAndValidateResourceIndicator(resourceStr);
        const approvedResource = authRecord.resource ?? this.resourceRegistry.getDefaultResource()?.getResourceUrl();
        if (tokenResource &&
            !(approvedResource &&
                (await (0, resource_identity_1.isSameProtectedResource)(this.resourceRegistry, tokenResource, approvedResource)))) {
            throw new InvalidResourceIndicatorError(tokenResource, approvedResource ?? 'none');
        }
        const grantedResource = approvedResource
            ? await this.resourceRegistry.getByResourceUrl(approvedResource)
            : this.resourceRegistry.getDefaultResource();
        const tokens = await this.grantService.runForActiveUser(authRecord.userId, async (ctx) => {
            await this.authorizationCodeService.markAuthorizationCodeAsUsed(authorizationCode, ctx);
            const grantedScopes = authRecord.scope;
            const { accessToken, refreshToken, audience } = this.tokenService.generateTokenPair(authRecord.userId, client.client_id, approvedResource, grantedScopes);
            await this.tokenService.saveTokenPair(accessToken, refreshToken, client.client_id, authRecord.userId, grantedScopes, audience, ctx);
            return {
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: this.tokenService.getAccessTokenExpirySeconds(),
                refresh_token: refreshToken,
                scope: grantedScopes.join(' '),
            };
        });
        if (grantedResource?.id === constants_1.INSTANCE_MCP_RESOURCE_ID) {
            this.eventService.emit('mcp-oauth-completed', {
                userId: authRecord.userId,
                clientId: client.client_id,
                clientName: client.client_name,
            });
        }
        this.logger.debug('OAuth token exchange succeeded', {
            clientId: client.client_id,
            userId: authRecord.userId,
        });
        return tokens;
    }
    async exchangeRefreshToken(client, refreshToken, _scopes, resource) {
        const resourceStr = resource?.toString();
        return await this.tokenService.validateAndRotateRefreshToken(refreshToken, client.client_id, await this.resolveAndValidateResourceIndicator(resourceStr));
    }
    async verifyAccessToken(token) {
        return await this.tokenService.verifyAccessToken(token);
    }
    async tryAutoApproveConsent(res, sessionPayload, client) {
        const req = res.req;
        const cookie = this.authService.getCookieToken(req);
        if (cookie) {
            let user;
            try {
                user = await this.authService.authenticateUserByCookie(cookie);
            }
            catch (error) {
                this.logger.debug('Auto-approval failed: user not authenticated', {
                    clientId: client.client_id,
                });
            }
            if (user) {
                const reuseResult = await this.oauthConsentService.tryReuseConsent(user, sessionPayload);
                if (reuseResult) {
                    return { redirectUrl: reuseResult.redirectUrl };
                }
            }
        }
        return null;
    }
    async isResourceUnavailable(resource) {
        return !((await resource.isAvailable?.()) ?? true);
    }
    async resolveAndValidateResourceIndicator(resource) {
        if (resource === undefined) {
            return undefined;
        }
        const normalizedResource = resource.replace(/\/$/, '');
        const match = await this.resourceRegistry.getByResourceUrl(normalizedResource);
        if (!match) {
            const knownResources = this.resourceRegistry
                .getAll()
                .map((registered) => registered.getResourceUrl())
                .join(', ');
            throw new InvalidResourceIndicatorError(resource, knownResources);
        }
        const declaredUrls = match.getResourceUrls?.() ?? [match.getResourceUrl()];
        const isDeclared = declaredUrls.some((url) => url.replace(/\/$/, '') === normalizedResource);
        return isDeclared ? normalizedResource : match.getResourceUrl();
    }
    async revokeToken(client, request) {
        const { token, token_type_hint } = request;
        if (!token_type_hint || token_type_hint === 'access_token') {
            const revoked = await this.tokenService.revokeAccessToken(token, client.client_id);
            if (revoked) {
                return;
            }
        }
        if (!token_type_hint || token_type_hint === 'refresh_token') {
            const revoked = await this.tokenService.revokeRefreshToken(token, client.client_id);
            if (revoked) {
                return;
            }
        }
        this.logger.debug('Token revocation requested for unknown token', {
            clientId: client.client_id,
        });
    }
    async getAllClients(user, options = {}) {
        const canSeeAll = (0, permissions_1.hasGlobalScope)(user, 'mcp:manage');
        const listAll = options.ownership === 'all';
        if (listAll && !canSeeAll) {
            throw new errors_1.ForbiddenError('You are not allowed to list connected clients of other users');
        }
        let clientIds;
        if (options.type) {
            const registered = await this.oauthClientRepository.find({
                select: { id: true, name: true },
                where: { isFirstParty: false },
            });
            clientIds = registered
                .filter((client) => matchesTypeFilter(client.name, options.type))
                .map((client) => client.id);
        }
        const { rows: consents, total } = clientIds?.length === 0
            ? { rows: [], total: 0 }
            : await this.userConsentRepository.findConnectedClients({
                userId: listAll ? undefined : user.id,
                withOwner: listAll,
                name: options.name,
                ownerId: listAll ? options.ownerId : undefined,
                clientIds,
                connected: options.connected,
                now: Date.now(),
                skip: options.skip,
                take: options.take,
            });
        const clients = consents.map((consent) => {
            const { clientSecret, clientSecretExpiresAt, ...sanitizedClient } = consent.client;
            return {
                ...sanitizedClient,
                grantedAt: Number(consent.grantedAt),
                scopes: consent.scope,
                ...(listAll
                    ? {
                        owner: {
                            id: consent.user.id,
                            firstName: consent.user.firstName ?? null,
                            lastName: consent.user.lastName ?? null,
                            email: consent.user.email,
                        },
                    }
                    : {}),
            };
        });
        const count = total;
        const [consentOwners, mineCount, allCount] = await Promise.all([
            listAll ? this.userConsentRepository.findConsentOwners() : undefined,
            this.userConsentRepository.countConnectedConsents(user.id),
            canSeeAll ? this.userConsentRepository.countConnectedConsents() : undefined,
        ]);
        const owners = consentOwners ? sortOwners(consentOwners) : undefined;
        const totals = { mine: mineCount };
        if (allCount !== undefined) {
            totals.all = allCount;
        }
        return { clients, count, totals, owners };
    }
    async getInstanceScopeTools() {
        return await this.resourceRegistry.getDefaultResource()?.getScopeTools?.();
    }
    async deleteClient(clientId, userId, revoker) {
        const client = await this.oauthClientRepository.findOne({
            where: { id: clientId },
        });
        if (!client) {
            throw new Error(`OAuth client with ID ${clientId} not found`);
        }
        const consent = await this.userConsentRepository.findOne({
            where: { clientId, userId },
            relations: ['user'],
        });
        if (!consent) {
            throw new Error(`OAuth client with ID ${clientId} not found`);
        }
        this.logger.info('Revoking OAuth client access for user', { clientId, userId });
        await Promise.all([
            this.tokenService.revokeAllTokensForGrant(clientId, userId),
            this.authorizationCodeService.deleteForGrant(clientId, userId),
            this.userConsentRepository.delete({ clientId, userId }),
        ]);
        const consentsTable = this.userConsentRepository.metadata.tableName;
        const result = await this.oauthClientRepository
            .createQueryBuilder()
            .delete()
            .from(oauth_client_entity_1.OAuthClient)
            .where(`id = :clientId AND NOT EXISTS (SELECT 1 FROM ${consentsTable} WHERE "clientId" = :clientId)`, { clientId })
            .execute();
        if (result.affected && result.affected > 0) {
            this.logger.info('OAuth client deleted after last consent was revoked', {
                clientId,
                clientName: client.name,
            });
        }
        if (revoker && revoker.id !== userId) {
            this.mailer
                .notifyMcpClientRevoked({ clientName: client.name, owner: consent.user, revoker })
                .catch((e) => {
                this.logger.error('Failed to send MCP client revocation email', {
                    clientId,
                    ownerId: userId,
                    error: e instanceof Error ? e.message : String(e),
                });
            });
        }
    }
};
exports.OAuthServerService = OAuthServerService;
exports.OAuthServerService = OAuthServerService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, config_1.GlobalConfig, oauth_session_service_1.OAuthSessionService, oauth_client_repository_1.OAuthClientRepository, oauth_token_service_1.OAuthTokenService, oauth_authorization_code_service_1.OAuthAuthorizationCodeService, oauth_user_consent_repository_1.UserConsentRepository, auth_1.ProtectedResourceRegistry, email_1.UserManagementMailer, backend_services_1.UrlService, backend_services_1.EventService, auth_service_1.AuthService, oauth_consent_service_1.OAuthConsentService, oauth_grant_service_1.OAuthGrantService])
], OAuthServerService);
class InvalidResourceIndicatorError extends errors_js_1.InvalidTargetError {
    constructor(resource, expectedResource) {
        super('Invalid resource indicator');
        this.resource = resource;
        this.expectedResource = expectedResource;
    }
}
//# sourceMappingURL=oauth-server.service.js.map