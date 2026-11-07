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
exports.DynamicCredentialService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const dynamic_credentials_proxy_1 = require("../../../credentials/dynamic-credentials-proxy");
const load_nodes_and_credentials_1 = require("../../../load-nodes-and-credentials");
const static_auth_service_1 = require("../../../services/static-auth-service");
const n8n_identifier_1 = require("../credential-resolvers/identifiers/n8n-identifier");
const credential_resolver_registry_service_1 = require("./credential-resolver-registry.service");
const resolver_config_expression_service_1 = require("./resolver-config-expression.service");
const shared_fields_1 = require("./shared-fields");
const constants_1 = require("../constants");
const credential_resolver_repository_1 = require("../database/repositories/credential-resolver.repository");
const dynamic_credentials_config_1 = require("../dynamic-credentials.config");
const credential_resolution_error_1 = require("../errors/credential-resolution.error");
const credential_resolver_not_configured_error_1 = require("../errors/credential-resolver-not-configured.error");
const credential_resolver_not_found_error_1 = require("../errors/credential-resolver-not-found.error");
const missing_execution_context_error_1 = require("../errors/missing-execution-context.error");
const n8n_identity_not_supported_error_1 = require("../errors/n8n-identity-not-supported.error");
let DynamicCredentialService = class DynamicCredentialService {
    constructor(dynamicCredentialConfig, resolverRegistry, resolverRepository, loadNodesAndCredentials, cipher, logger, expressionService, dynamicCredentialsProxy) {
        this.dynamicCredentialConfig = dynamicCredentialConfig;
        this.resolverRegistry = resolverRegistry;
        this.resolverRepository = resolverRepository;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.cipher = cipher;
        this.logger = logger;
        this.expressionService = expressionService;
        this.dynamicCredentialsProxy = dynamicCredentialsProxy;
    }
    async resolveIfNeeded(credentialsResolveMetadata, staticData, executionContext, workflowSettings, executionId) {
        const resolverId = credentialsResolveMetadata.resolverId ??
            this.dynamicCredentialsProxy.getEffectiveResolverId(workflowSettings);
        if (!credentialsResolveMetadata.isResolvable) {
            return { data: staticData, isDynamic: false };
        }
        if (!resolverId) {
            return this.handleResolverNotConfigured(credentialsResolveMetadata);
        }
        const resolverEntity = await this.resolverRepository.findOneBy({
            id: resolverId,
        });
        if (!resolverEntity) {
            return this.handleResolverNotFound(credentialsResolveMetadata, resolverId);
        }
        const resolver = this.resolverRegistry.getResolverByTypename(resolverEntity.type);
        if (!resolver) {
            return this.handleResolverNotFound(credentialsResolveMetadata, resolverId);
        }
        const credentialContext = await this.buildCredentialContext(executionContext);
        if (!credentialContext) {
            return this.handleMissingContext(credentialsResolveMetadata);
        }
        if ((0, n8n_identifier_1.carriesN8nIdentity)(credentialContext) && !resolver.resolveOwningUserId) {
            this.logger.debug('Refused to resolve external-subject credential with n8n identity', {
                credentialId: credentialsResolveMetadata.id,
                credentialName: credentialsResolveMetadata.name,
                resolverId,
                resolverType: resolverEntity.type,
            });
            throw new n8n_identity_not_supported_error_1.N8nIdentityNotSupportedError(credentialsResolveMetadata.name);
        }
        try {
            const credentialType = this.loadNodesAndCredentials.getCredential(credentialsResolveMetadata.type);
            const sharedFields = (0, shared_fields_1.extractSharedFields)(credentialType.type);
            const decryptedConfig = await this.cipher.decryptV2(resolverEntity.config);
            const parsedConfig = (0, n8n_workflow_1.jsonParse)(decryptedConfig);
            const resolverConfig = await this.expressionService.resolve(parsedConfig);
            const handle = {
                resolverId: resolverEntity.id,
                resolverName: resolverEntity.type,
                configuration: resolverConfig,
            };
            const dynamicData = await resolver.getSecret(credentialsResolveMetadata.id, credentialContext, handle, executionId);
            this.logger.debug('Successfully resolved dynamic credentials', {
                credentialId: credentialsResolveMetadata.id,
                resolverId,
                resolverSource: credentialsResolveMetadata.resolverId ? 'credential' : 'workflow',
                identity: credentialContext.identity,
            });
            for (const field of sharedFields) {
                if (field in dynamicData) {
                    delete dynamicData[field];
                }
            }
            let resolvedUserId;
            try {
                resolvedUserId = await resolver.resolveOwningUserId?.(credentialContext, handle, executionId);
            }
            catch (error) {
                this.logger.debug('Could not resolve owning user for dynamic credentials', {
                    credentialId: credentialsResolveMetadata.id,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            return { data: { ...staticData, ...dynamicData }, isDynamic: true, resolvedUserId };
        }
        catch (error) {
            return this.handleResolutionError(credentialsResolveMetadata, error, resolverEntity.id, resolverEntity.type);
        }
    }
    getSystemResolverId() {
        return constants_1.SYSTEM_RESOLVER_ID;
    }
    async resolveOwningUserIdForAuthorization(credentialContext, resolverId) {
        const resolverEntity = await this.resolverRepository.findOneBy({ id: resolverId });
        const resolver = resolverEntity && this.resolverRegistry.getResolverByTypename(resolverEntity.type);
        if (!resolverEntity || !resolver?.resolveOwningUserId) {
            return { status: 'unbound' };
        }
        try {
            const parsedConfig = (0, n8n_workflow_1.jsonParse)(await this.cipher.decryptV2(resolverEntity.config));
            const resolverConfig = await this.expressionService.resolve(parsedConfig);
            const userId = await resolver.resolveOwningUserId(credentialContext, {
                resolverId: resolverEntity.id,
                resolverName: resolverEntity.type,
                configuration: resolverConfig,
            });
            return userId ? { status: 'bound', userId } : { status: 'unresolved' };
        }
        catch {
            return { status: 'unresolved' };
        }
    }
    async buildCredentialContext(executionContext) {
        if (!executionContext?.credentials) {
            return undefined;
        }
        try {
            const decrypted = await this.cipher.decryptV2(executionContext.credentials);
            return (0, n8n_workflow_1.toCredentialContext)(decrypted);
        }
        catch (error) {
            this.logger.error('Failed to decrypt credential context from execution context', {
                error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        }
    }
    handleResolutionError(credentialsResolveMetadata, error, resolverId, resolverType) {
        this.logger.debug('Dynamic credential resolution failed', {
            credentialId: credentialsResolveMetadata.id,
            credentialName: credentialsResolveMetadata.name,
            resolverId,
            resolverSource: credentialsResolveMetadata.resolverId ? 'credential' : 'workflow',
            error: error instanceof Error ? error.message : String(error),
        });
        if (error instanceof decorators_1.CredentialResolverDataNotFoundError &&
            resolverType === constants_1.SYSTEM_RESOLVER_TYPE) {
            throw new credential_resolution_error_1.CredentialResolutionError(`'${credentialsResolveMetadata.name}' end-user credential is not connected for you. Connect yours to execute this workflow manually.`, { cause: error });
        }
        if (error instanceof credential_resolution_error_1.CredentialResolutionError || error instanceof decorators_1.CredentialResolverError) {
            throw new credential_resolution_error_1.CredentialResolutionError(`Failed to resolve dynamic credentials for "${credentialsResolveMetadata.name}": ${error.message}`, { cause: error });
        }
        throw new credential_resolution_error_1.CredentialResolutionError(`Failed to resolve dynamic credentials for "${credentialsResolveMetadata.name}"`, { cause: error });
    }
    handleResolverNotConfigured(credentialsResolveMetadata) {
        this.logger.debug('No resolver configured for dynamic credential', {
            credentialId: credentialsResolveMetadata.id,
            credentialName: credentialsResolveMetadata.name,
        });
        throw new credential_resolver_not_configured_error_1.CredentialResolverNotConfiguredError(credentialsResolveMetadata.name);
    }
    handleResolverNotFound(credentialsResolveMetadata, resolverId) {
        this.logger.debug('Resolver not found for dynamic credential', {
            credentialId: credentialsResolveMetadata.id,
            credentialName: credentialsResolveMetadata.name,
            resolverId,
            resolverSource: credentialsResolveMetadata.resolverId ? 'credential' : 'workflow',
        });
        throw new credential_resolver_not_found_error_1.CredentialResolverNotFoundError(credentialsResolveMetadata.name, resolverId);
    }
    handleMissingContext(credentialsResolveMetadata) {
        this.logger.debug('No execution context available for dynamic credential', {
            credentialId: credentialsResolveMetadata.id,
            credentialName: credentialsResolveMetadata.name,
        });
        throw new missing_execution_context_error_1.MissingExecutionContextError();
    }
    getDynamicCredentialsEndpointsMiddleware() {
        const { endpointAuthToken } = this.dynamicCredentialConfig;
        if (!endpointAuthToken?.trim()) {
            return (req, res, next) => {
                if (req.user) {
                    return next();
                }
                this.logger.error('Dynamic credentials external endpoints require an endpoint auth token. Please set the N8N_DYNAMIC_CREDENTIALS_ENDPOINT_AUTH_TOKEN environment variable to enable access.');
                res.status(500).json({
                    message: 'Dynamic credentials configuration is invalid. Check server logs for details.',
                });
                return;
            };
        }
        const staticAuthMiddlware = static_auth_service_1.StaticAuthService.getStaticAuthMiddleware(endpointAuthToken, 'x-authorization');
        return (req, res, next) => {
            if (req.user) {
                return next();
            }
            return staticAuthMiddlware(req, res, next);
        };
    }
};
exports.DynamicCredentialService = DynamicCredentialService;
exports.DynamicCredentialService = DynamicCredentialService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [dynamic_credentials_config_1.DynamicCredentialsConfig, credential_resolver_registry_service_1.DynamicCredentialResolverRegistry, credential_resolver_repository_1.DynamicCredentialResolverRepository, load_nodes_and_credentials_1.LoadNodesAndCredentials, n8n_core_1.Cipher, backend_common_1.Logger, resolver_config_expression_service_1.ResolverConfigExpressionService, dynamic_credentials_proxy_1.DynamicCredentialsProxy])
], DynamicCredentialService);
//# sourceMappingURL=dynamic-credential.service.js.map