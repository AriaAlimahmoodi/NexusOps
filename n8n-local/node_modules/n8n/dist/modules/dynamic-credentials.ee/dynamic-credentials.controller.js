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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicCredentialsController = void 0;
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_ee_1 = require("../../credentials/credentials.service.ee");
const errors_1 = require("@n8n/errors");
const oauth_service_1 = require("../../oauth/oauth.service");
const n8n_identifier_1 = require("./credential-resolvers/identifiers/n8n-identifier");
const credential_resolver_repository_1 = require("./database/repositories/credential-resolver.repository");
const dynamic_credentials_config_1 = require("./dynamic-credentials.config");
const n8n_identity_not_supported_error_1 = require("./errors/n8n-identity-not-supported.error");
const services_1 = require("./services");
const dynamic_credential_cors_service_1 = require("./services/dynamic-credential-cors.service");
const dynamic_credential_web_service_1 = require("./services/dynamic-credential-web.service");
const utils_1 = require("./utils");
const dynamicCredentialsConfig = di_1.Container.get(dynamic_credentials_config_1.DynamicCredentialsConfig);
const NO_CONNECTION_TO_DISCONNECT = 'No connection to disconnect';
let DynamicCredentialsController = class DynamicCredentialsController {
    constructor(enterpriseCredentialsService, oauthService, resolverRepository, resolverRegistry, cipher, dynamicCredentialCorsService, dynamicCredentialWebService, credentialsFinderService, credentialConnectionStatusService, eventService, authorizeIntentService, dynamicCredentialService, urlService) {
        this.enterpriseCredentialsService = enterpriseCredentialsService;
        this.oauthService = oauthService;
        this.resolverRepository = resolverRepository;
        this.resolverRegistry = resolverRegistry;
        this.cipher = cipher;
        this.dynamicCredentialCorsService = dynamicCredentialCorsService;
        this.dynamicCredentialWebService = dynamicCredentialWebService;
        this.credentialsFinderService = credentialsFinderService;
        this.credentialConnectionStatusService = credentialConnectionStatusService;
        this.eventService = eventService;
        this.authorizeIntentService = authorizeIntentService;
        this.dynamicCredentialService = dynamicCredentialService;
        this.urlService = urlService;
    }
    async findCredentialToUse(credentialId) {
        const credential = await this.enterpriseCredentialsService.getOne(credentialId);
        if (!credential?.isResolvable) {
            throw new errors_1.NotFoundError('Credential not found');
        }
        if (!credential.type.toLowerCase().includes('oauth2') &&
            !credential.type.toLowerCase().includes('oauth1')) {
            throw new errors_1.BadRequestError('Credential type not supported');
        }
        return credential;
    }
    async getResolverInstance(resolverId, credentialContext, credentialName) {
        if (!resolverId) {
            throw new errors_1.BadRequestError('Missing resolverId query parameter');
        }
        const resolverEntity = await this.resolverRepository.findOneBy({
            id: resolverId,
        });
        if (!resolverEntity) {
            throw new errors_1.NotFoundError('Resolver not found');
        }
        const resolver = this.resolverRegistry.getResolverByTypename(resolverEntity.type);
        if (!resolver) {
            throw new errors_1.NotFoundError('Resolver type not found');
        }
        if ((0, n8n_identifier_1.carriesN8nIdentity)(credentialContext) && !resolver.resolveOwningUserId) {
            throw new errors_1.BadRequestError(new n8n_identity_not_supported_error_1.N8nIdentityNotSupportedError(credentialName).message);
        }
        return { resolver, resolverEntity };
    }
    handlePreflightCredentialRevoke(req, res) {
        this.dynamicCredentialCorsService.preflightHandler(req, res, ['delete', 'options']);
    }
    async revokeCredential(req, res) {
        this.dynamicCredentialCorsService.applyCorsHeadersIfEnabled(req, res, ['delete', 'options']);
        const credentialContext = this.dynamicCredentialWebService.getCredentialContextFromRequest(req);
        const credential = await this.findCredentialToUse(req.params.id);
        const resolverId = req.query.resolverId;
        const { resolver, resolverEntity } = await this.getResolverInstance(resolverId, credentialContext, credential.name);
        if (resolver.deleteSecret) {
            const decryptedConfig = await this.cipher.decryptV2(resolverEntity.config);
            const resolverConfig = (0, n8n_workflow_1.jsonParse)(decryptedConfig);
            await resolver.deleteSecret(credential.id, credentialContext, {
                configuration: resolverConfig,
                resolverId: resolverEntity.id,
                resolverName: resolverEntity.type,
            });
        }
        res.status(204).send();
    }
    handlePreflightCredentialAuthorize(req, res) {
        this.dynamicCredentialCorsService.preflightHandler(req, res, ['post', 'options']);
    }
    async authorizeCredential(req, res) {
        this.dynamicCredentialCorsService.applyCorsHeadersIfEnabled(req, res, ['post', 'options']);
        const credentialContext = this.dynamicCredentialWebService.getCredentialContextFromRequest(req);
        const credential = await this.findCredentialToUse(req.params.id);
        const resolverId = req.query.resolverId;
        const { resolver, resolverEntity } = await this.getResolverInstance(resolverId, credentialContext, credential.name);
        if (resolver.validateIdentity) {
            const decryptedConfig = await this.cipher.decryptV2(resolverEntity.config);
            const resolverConfig = (0, n8n_workflow_1.jsonParse)(decryptedConfig);
            await resolver.validateIdentity(credentialContext, {
                resolverId: resolverEntity.id,
                resolverName: resolverEntity.type,
                configuration: resolverConfig,
            });
        }
        const ownership = await this.dynamicCredentialService.resolveOwningUserIdForAuthorization(credentialContext, resolverEntity.id);
        const csrfData = {
            cid: credential.id,
            origin: 'dynamic-credential',
            authorizationHeader: req.headers.authorization ?? `Bearer ${credentialContext.identity}`,
            authMetadata: credentialContext.metadata,
            credentialResolverId: req.query.resolverId,
            userId: ownership.status === 'bound' ? ownership.userId : undefined,
        };
        if (credential.type.toLowerCase().includes('oauth2')) {
            return await this.oauthService.generateAOauth2AuthUri(credential, csrfData, req, res);
        }
        if (credential.type.toLowerCase().includes('oauth1')) {
            return await this.oauthService.generateAOauth1AuthUri(credential, csrfData, req, res);
        }
        throw new errors_1.BadRequestError('Credential type not supported');
    }
    async authorizeCredentialRedirect(req, res) {
        const token = typeof req.query.token === 'string' ? req.query.token : undefined;
        if (!token) {
            this.oauthService.renderCallbackError(res, 'Missing authorization token.');
            return;
        }
        const intent = await this.authorizeIntentService.get(token);
        if (!intent || intent.credentialId !== req.params.id) {
            this.oauthService.renderCallbackError(res, 'This authorization link is invalid or has expired. Please request a new one.');
            return;
        }
        if (intent.userId) {
            const user = (0, db_1.isAuthenticatedRequest)(req) ? req.user : undefined;
            if (!user) {
                this.eventService.emit('dynamic-credential-authorize-rejected', {
                    reason: 'unauthenticated',
                    credentialId: intent.credentialId,
                });
                const returnUrl = `${this.urlService.getInstanceBaseUrl()}${req.originalUrl}`;
                res.redirect(`${this.urlService.getInstanceBaseUrl()}/signin?redirect=${encodeURIComponent(returnUrl)}`);
                return;
            }
            if (user.id !== intent.userId) {
                this.eventService.emit('dynamic-credential-authorize-rejected', {
                    reason: 'user-mismatch',
                    credentialId: intent.credentialId,
                });
                this.oauthService.renderCallbackError(res, 'This authorization link was issued for a different account. Sign in as the intended user and open the link again.');
                return;
            }
        }
        try {
            const credential = await this.findCredentialToUse(intent.credentialId);
            const csrfData = {
                cid: credential.id,
                origin: 'dynamic-credential',
                authorizationHeader: intent.identity ? `Bearer ${intent.identity}` : '',
                authMetadata: intent.metadata,
                credentialResolverId: intent.resolverId,
                userId: intent.userId,
            };
            const authorizationUrl = credential.type.toLowerCase().includes('oauth2')
                ? await this.oauthService.generateAOauth2AuthUri(credential, csrfData, req, res)
                : await this.oauthService.generateAOauth1AuthUri(credential, csrfData, req, res);
            res.redirect(authorizationUrl);
        }
        catch (e) {
            this.oauthService.renderCallbackError(res, (0, ensure_error_1.ensureError)(e).message);
        }
    }
    async deleteMyConnection(req, res, credentialId) {
        const credential = await this.credentialsFinderService.findById(credentialId);
        if (!credential) {
            throw new errors_1.NotFoundError(NO_CONNECTION_TO_DISCONNECT);
        }
        const affected = await this.credentialConnectionStatusService.deleteMyConnection(req.user.id, credentialId);
        if (affected === 0) {
            throw new errors_1.NotFoundError(NO_CONNECTION_TO_DISCONNECT);
        }
        this.eventService.emit('credentials-user-disconnected', {
            user: req.user,
            credentialId,
            credentialType: credential.type,
        });
        res.status(204).send();
    }
};
exports.DynamicCredentialsController = DynamicCredentialsController;
__decorate([
    (0, decorators_1.Options)('/:id/revoke', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DynamicCredentialsController.prototype, "handlePreflightCredentialRevoke", null);
__decorate([
    (0, decorators_1.Delete)('/:id/revoke', {
        allowUnauthenticated: true,
        middlewares: (0, utils_1.getDynamicCredentialMiddlewares)(),
        ipRateLimit: {
            limit: dynamicCredentialsConfig.rateLimitPerMinute,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DynamicCredentialsController.prototype, "revokeCredential", null);
__decorate([
    (0, decorators_1.Options)('/:id/authorize', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DynamicCredentialsController.prototype, "handlePreflightCredentialAuthorize", null);
__decorate([
    (0, decorators_1.Post)('/:id/authorize', {
        allowUnauthenticated: true,
        middlewares: (0, utils_1.getDynamicCredentialMiddlewares)(),
        ipRateLimit: {
            limit: dynamicCredentialsConfig.rateLimitAuthorizePerMinute,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DynamicCredentialsController.prototype, "authorizeCredential", null);
__decorate([
    (0, decorators_1.Get)('/:id/authorize', {
        allowUnauthenticated: true,
        usesTemplates: true,
        ipRateLimit: {
            limit: dynamicCredentialsConfig.rateLimitAuthorizePerMinute,
            windowMs: 1 * constants_1.Time.minutes.toMilliseconds,
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DynamicCredentialsController.prototype, "authorizeCredentialRedirect", null);
__decorate([
    (0, decorators_1.Delete)('/:credentialId/my-connection'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], DynamicCredentialsController.prototype, "deleteMyConnection", null);
exports.DynamicCredentialsController = DynamicCredentialsController = __decorate([
    (0, decorators_1.RestController)('/credentials'),
    __metadata("design:paramtypes", [credentials_service_ee_1.EnterpriseCredentialsService, oauth_service_1.OauthService, credential_resolver_repository_1.DynamicCredentialResolverRepository, services_1.DynamicCredentialResolverRegistry, n8n_core_1.Cipher, dynamic_credential_cors_service_1.DynamicCredentialCorsService, dynamic_credential_web_service_1.DynamicCredentialWebService, backend_services_1.CredentialsFinderService, services_1.CredentialConnectionStatusService, backend_services_1.EventService, services_1.AuthorizeIntentService, services_1.DynamicCredentialService, backend_services_1.UrlService])
], DynamicCredentialsController);
//# sourceMappingURL=dynamic-credentials.controller.js.map