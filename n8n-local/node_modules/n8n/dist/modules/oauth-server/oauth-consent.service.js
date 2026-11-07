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
exports.OAuthConsentService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const oauth_client_repository_1 = require("./database/repositories/oauth-client.repository");
const oauth_user_consent_repository_1 = require("./database/repositories/oauth-user-consent.repository");
const oauth_authorization_code_service_1 = require("./oauth-authorization-code.service");
const oauth_session_service_1 = require("./oauth-session.service");
const oauth_grant_service_1 = require("./oauth-grant.service");
const oauth_helpers_1 = require("./oauth.helpers");
const errors_1 = require("@n8n/errors");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
let OAuthConsentService = class OAuthConsentService {
    constructor(logger, oauthSessionService, oauthClientRepository, userConsentRepository, authorizationCodeService, protectedResourceRegistry, urlService, grantService) {
        this.logger = logger;
        this.oauthSessionService = oauthSessionService;
        this.oauthClientRepository = oauthClientRepository;
        this.userConsentRepository = userConsentRepository;
        this.authorizationCodeService = authorizationCodeService;
        this.protectedResourceRegistry = protectedResourceRegistry;
        this.urlService = urlService;
        this.grantService = grantService;
    }
    async getConsentDetails(sessionToken, user) {
        try {
            const sessionPayload = this.oauthSessionService.verifySession(sessionToken);
            const client = await this.oauthClientRepository.findOne({
                where: { id: sessionPayload.clientId },
            });
            if (!client) {
                return null;
            }
            if (sessionPayload.resource) {
                const resource = await this.protectedResourceRegistry.getByResourceUrl(sessionPayload.resource);
                if (!resource) {
                    return { ok: false, reason: 'resource_unavailable' };
                }
                const reuse = await this.tryReuseConsent(user, sessionPayload, resource);
                if (reuse) {
                    return {
                        ok: true,
                        autoApproved: true,
                        redirectUrl: reuse.redirectUrl,
                        uiHints: resource.uiHints,
                    };
                }
                if (!(await resource.authorize(user)))
                    return {
                        ok: false,
                        reason: 'forbidden',
                    };
                const scopes = this.grantableScopes(await this.supportedScopesFor(resource, user), sessionPayload.requestedScopes);
                return {
                    ok: true,
                    autoApproved: false,
                    clientName: client.name,
                    clientId: client.id,
                    resourceName: resource.displayName,
                    redirectUri: sessionPayload.redirectUri,
                    scopes,
                    previousScopes: await this.previousScopes(user.id, client.id, scopes),
                    scopeTools: await resource.getScopeTools?.(),
                    uiHints: resource.uiHints,
                    isFirstParty: client.isFirstParty,
                };
            }
            const defaultResource = this.protectedResourceRegistry.getDefaultResource();
            if (defaultResource && !(await defaultResource.authorize(user))) {
                return { ok: false, reason: 'forbidden' };
            }
            const scopes = this.grantableScopes(await this.supportedScopesFor(defaultResource, user), sessionPayload.requestedScopes);
            return {
                ok: true,
                autoApproved: false,
                clientName: client.name,
                clientId: client.id,
                redirectUri: sessionPayload.redirectUri,
                scopes,
                previousScopes: await this.previousScopes(user.id, client.id, scopes),
                scopeTools: await defaultResource?.getScopeTools?.(),
                uiHints: defaultResource?.uiHints,
                isFirstParty: client.isFirstParty,
            };
        }
        catch (error) {
            this.logger.error('Error getting consent details', { error });
            return null;
        }
    }
    async supportedScopesFor(resource, user) {
        if (!resource)
            return [];
        return resource.getGrantableScopes ? await resource.getGrantableScopes(user) : resource.scopes;
    }
    grantableScopes(supportedScopes, requestedScopes) {
        if (!requestedScopes || requestedScopes.length === 0)
            return supportedScopes;
        return supportedScopes.filter((scope) => requestedScopes.includes(scope));
    }
    async previousScopes(userId, clientId, grantableScopes) {
        if (grantableScopes.length === 0)
            return undefined;
        const consent = await this.userConsentRepository.findOneBy({ userId, clientId });
        if (!consent?.scope)
            return undefined;
        const previous = consent.scope.filter((scope) => grantableScopes.includes(scope));
        return previous.length > 0 ? previous : undefined;
    }
    async handleConsentDecision(sessionToken, user, approved, scopes) {
        let sessionPayload;
        try {
            sessionPayload = this.oauthSessionService.verifySession(sessionToken);
        }
        catch (error) {
            throw new n8n_workflow_1.UserError('Invalid or expired session');
        }
        const issuer = this.urlService.getInstanceBaseUrl();
        if (!approved) {
            const redirectUrl = oauth_helpers_1.OAuthHelpers.buildErrorRedirectUrl(sessionPayload.redirectUri, 'access_denied', 'User denied the authorization request', sessionPayload.state, issuer);
            this.logger.info('Consent denied', {
                clientId: sessionPayload.clientId,
                userId: user.id,
            });
            return { redirectUrl };
        }
        if (sessionPayload.resource) {
            const resource = await this.protectedResourceRegistry.getByResourceUrl(sessionPayload.resource);
            if (!resource) {
                throw new n8n_workflow_1.UserError('Resource is not available for the requested authorization');
            }
            await this.assertAuthorized(resource, user, sessionPayload.clientId);
        }
        else {
            const defaultResource = this.protectedResourceRegistry.getDefaultResource();
            if (defaultResource) {
                await this.assertAuthorized(defaultResource, user, sessionPayload.clientId);
            }
        }
        const grantedScopes = await this.resolveGrantedScopes(sessionPayload, scopes, user);
        return await this.issueGrant(user, sessionPayload, grantedScopes);
    }
    async assertAuthorized(resource, user, clientId) {
        if (await resource.authorize(user))
            return;
        this.logger.warn('User is not authorized for the requested resource', {
            clientId,
            userId: user.id,
            resourceUrl: resource.getResourceUrl(),
        });
        throw new errors_1.ForbiddenError('User is not authorized for the requested resource');
    }
    async issueGrant(user, sessionPayload, grantedScopes, ctx = {}) {
        return await this.grantService.runForActiveUser(user.id, async (ctx) => {
            const issuer = this.urlService.getInstanceBaseUrl();
            await this.userConsentRepository.saveGrant(user.id, sessionPayload.clientId, grantedScopes, ctx);
            const code = await this.authorizationCodeService.createAuthorizationCode(sessionPayload.clientId, user.id, sessionPayload.redirectUri, sessionPayload.codeChallenge, sessionPayload.state, sessionPayload.resource, grantedScopes, ctx);
            const successRedirectUrl = oauth_helpers_1.OAuthHelpers.buildSuccessRedirectUrl(sessionPayload.redirectUri, code, sessionPayload.state, issuer);
            this.logger.info('Consent approved', {
                clientId: sessionPayload.clientId,
                userId: user.id,
            });
            return { redirectUrl: successRedirectUrl };
        }, ctx);
    }
    async resolveGrantedScopes(sessionPayload, scopes, user) {
        const resource = sessionPayload.resource
            ? await this.protectedResourceRegistry.getByResourceUrl(sessionPayload.resource)
            : this.protectedResourceRegistry.getDefaultResource();
        const supportedScopes = await this.supportedScopesFor(resource, user);
        if (supportedScopes.length === 0) {
            return [];
        }
        if (!scopes || scopes.length === 0) {
            throw new n8n_workflow_1.UserError('At least one scope must be granted');
        }
        const grantable = this.grantableScopes(supportedScopes, sessionPayload.requestedScopes);
        const ungrantable = scopes.filter((scope) => !grantable.includes(scope));
        if (ungrantable.length > 0) {
            throw new n8n_workflow_1.UserError(`Scopes cannot be granted: ${ungrantable.join(', ')}`);
        }
        return scopes;
    }
    async tryReuseConsent(user, sessionPayload, resolvedResource) {
        if (!sessionPayload.resource)
            return null;
        const resource = resolvedResource ??
            (await this.protectedResourceRegistry.getByResourceUrl(sessionPayload.resource));
        if (!resource?.isFirstParty)
            return null;
        const consent = await this.userConsentRepository.findGrant(user.id, sessionPayload.clientId, {});
        if (!consent) {
            return null;
        }
        const grantable = this.grantableScopes(await this.supportedScopesFor(resource, user), sessionPayload.requestedScopes);
        const requestedScopes = sessionPayload.requestedScopes ?? [];
        if (requestedScopes.length > 0) {
            if (!grantable.every((scope) => consent.scope.includes(scope)))
                return null;
        }
        const consented = grantable.filter((scope) => consent.scope.includes(scope));
        if (grantable.length > 0 && consented.length === 0)
            return null;
        if (!(await resource.authorize(user))) {
            this.logger.debug('Consent reuse skipped: user no longer authorized for resource', {
                clientId: sessionPayload.clientId,
                userId: user.id,
                resourceUrl: sessionPayload.resource,
            });
            return null;
        }
        return await this.grantService.runForActiveUser(user.id, async (ctx) => {
            const currentConsent = await this.userConsentRepository.findGrant(user.id, sessionPayload.clientId, ctx);
            if (!currentConsent ||
                currentConsent.id !== consent.id ||
                currentConsent.grantedAt !== consent.grantedAt)
                return null;
            return await this.issueGrant(user, sessionPayload, consented, ctx);
        });
    }
};
exports.OAuthConsentService = OAuthConsentService;
exports.OAuthConsentService = OAuthConsentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, oauth_session_service_1.OAuthSessionService, oauth_client_repository_1.OAuthClientRepository, oauth_user_consent_repository_1.UserConsentRepository, oauth_authorization_code_service_1.OAuthAuthorizationCodeService, auth_1.ProtectedResourceRegistry, backend_services_1.UrlService, oauth_grant_service_1.OAuthGrantService])
], OAuthConsentService);
//# sourceMappingURL=oauth-consent.service.js.map