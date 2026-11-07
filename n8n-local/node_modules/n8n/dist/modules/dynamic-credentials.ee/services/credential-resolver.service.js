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
exports.DynamicCredentialResolverService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const active_workflow_manager_1 = require("../../../active-workflow-manager");
const config_redaction_1 = require("../config-redaction");
const constants_1 = require("../constants");
const credential_resolver_registry_service_1 = require("./credential-resolver-registry.service");
const resolver_config_expression_service_1 = require("./resolver-config-expression.service");
const credential_resolver_repository_1 = require("../database/repositories/credential-resolver.repository");
const credential_resolver_not_found_error_1 = require("../errors/credential-resolver-not-found.error");
const system_resolver_modification_error_1 = require("../errors/system-resolver-modification.error");
let DynamicCredentialResolverService = class DynamicCredentialResolverService {
    constructor(logger, repository, registry, cipher, expressionService, workflowRepository, activeWorkflowManager) {
        this.logger = logger;
        this.repository = repository;
        this.registry = registry;
        this.cipher = cipher;
        this.expressionService = expressionService;
        this.workflowRepository = workflowRepository;
        this.activeWorkflowManager = activeWorkflowManager;
        this.logger = this.logger.scoped('dynamic-credentials');
    }
    async create(params) {
        if (params.type === constants_1.SYSTEM_RESOLVER_TYPE) {
            throw new system_resolver_modification_error_1.SystemResolverModificationError('create');
        }
        const canUseExternalSecrets = (0, permissions_1.hasGlobalScope)(params.user, 'externalSecret:list');
        await this.validateConfig(params.type, params.config, canUseExternalSecrets);
        const encryptedConfig = await this.encryptConfig(params.config);
        const resolver = this.repository.create({
            name: params.name,
            type: params.type,
            config: encryptedConfig,
        });
        const saved = await this.repository.save(resolver);
        this.logger.debug(`Created credential resolver "${saved.name}" (${saved.id})`);
        return await this.withDecryptedConfig(saved);
    }
    async findAll() {
        const resolvers = await this.repository.find();
        return await Promise.all(resolvers.map(async (resolver) => await this.withDecryptedConfig(resolver)));
    }
    async findAllPublic() {
        const resolvers = await this.repository.find({ where: { id: (0, typeorm_1.Not)(constants_1.SYSTEM_RESOLVER_ID) } });
        return await Promise.all(resolvers.map(async (resolver) => await this.withDecryptedConfig(resolver)));
    }
    getAvailableTypes() {
        return this.registry.getAllResolvers();
    }
    getAvailablePublicTypes() {
        return this.getAvailableTypes().filter((r) => r.metadata.name !== constants_1.SYSTEM_RESOLVER_TYPE);
    }
    async findById(id) {
        const resolver = await this.repository.findOneBy({ id });
        if (!resolver) {
            throw new credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError(id);
        }
        return await this.withDecryptedConfig(resolver);
    }
    async update(id, params) {
        if (id === constants_1.SYSTEM_RESOLVER_ID) {
            throw new system_resolver_modification_error_1.SystemResolverModificationError('update');
        }
        if (params.type === constants_1.SYSTEM_RESOLVER_TYPE) {
            throw new system_resolver_modification_error_1.SystemResolverModificationError('update');
        }
        const existing = await this.repository.findOneBy({ id });
        if (!existing) {
            throw new credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError(id);
        }
        const canUseExternalSecrets = (0, permissions_1.hasGlobalScope)(params.user, 'externalSecret:list');
        if (params.type !== undefined) {
            existing.type = params.type;
            if (params.config === undefined) {
                const existingConfig = await this.decryptConfig(existing.config);
                await this.validateConfig(existing.type, existingConfig, canUseExternalSecrets);
            }
        }
        if (params.config !== undefined) {
            const config = await this.restoreRedactedSecrets(existing, params.config);
            await this.validateConfig(existing.type, config, canUseExternalSecrets);
            existing.config = await this.encryptConfig(config);
        }
        if (params.name !== undefined) {
            existing.name = params.name;
        }
        if (params.clearCredentials === true) {
            const resolver = this.registry.getResolverByTypename(existing.type);
            if (!resolver) {
                throw new decorators_1.CredentialResolverValidationError(`Unknown resolver type: ${existing.type}`);
            }
            if ('deleteAllSecrets' in resolver && typeof resolver.deleteAllSecrets === 'function') {
                await resolver.deleteAllSecrets({
                    resolverId: id,
                    resolverName: resolver.metadata.name,
                    configuration: await this.decryptConfig(existing.config),
                });
            }
        }
        const saved = await this.repository.save(existing);
        this.logger.debug(`Updated credential resolver "${saved.name}" (${saved.id})`);
        return await this.withDecryptedConfig(saved);
    }
    async findAffectedWorkflows(id) {
        const existing = await this.repository.findOneBy({ id });
        if (!existing) {
            throw new credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError(id);
        }
        return await this.workflowRepository.findByCredentialResolverId(id);
    }
    async delete(id) {
        if (id === constants_1.SYSTEM_RESOLVER_ID) {
            throw new system_resolver_modification_error_1.SystemResolverModificationError('delete');
        }
        const existing = await this.repository.findOneBy({ id });
        if (!existing) {
            throw new credential_resolver_not_found_error_1.DynamicCredentialResolverNotFoundError(id);
        }
        const affectedWorkflows = await this.workflowRepository.findActiveByCredentialResolverId(id);
        const { manager } = this.repository;
        await manager.transaction(async (trx) => {
            await this.workflowRepository.clearCredentialResolverId(id, trx);
            await trx.remove(existing);
        });
        this.logger.debug(`Deleted credential resolver "${existing.name}" (${id})`);
        for (const workflowId of affectedWorkflows) {
            try {
                await this.activeWorkflowManager.remove(workflowId);
                await this.activeWorkflowManager.add(workflowId, 'update');
            }
            catch (error) {
                this.logger.warn(`Failed to reactivate workflow "${workflowId}" after resolver deletion, deactivating it`, { error });
                try {
                    await this.activeWorkflowManager.remove(workflowId);
                }
                catch (cleanupError) {
                    this.logger.error(`Failed to roll back partial reactivation of workflow "${workflowId}"`, { workflowId, error: cleanupError });
                }
                await this.workflowRepository.update(workflowId, {
                    active: false,
                    activeVersionId: null,
                });
            }
        }
    }
    async validateConfig(type, config, canUseExternalSecrets = false) {
        const resolverImplementation = this.registry.getResolverByTypename(type);
        if (!resolverImplementation) {
            throw new decorators_1.CredentialResolverValidationError(`Unknown resolver type: ${type}`);
        }
        let resolvedConfig = config;
        try {
            resolvedConfig = await this.expressionService.resolve(config, canUseExternalSecrets);
        }
        catch (error) {
            throw new decorators_1.CredentialResolverValidationError(`Invalid expression in resolver config: ${error instanceof Error ? error.message : String(error)}`);
        }
        await resolverImplementation.validateOptions(resolvedConfig);
    }
    async restoreRedactedSecrets(existing, incoming) {
        const secretFields = (0, config_redaction_1.collectSecretFieldNames)(this.registry.getResolverByTypename(existing.type)?.metadata.options);
        if (secretFields.size === 0) {
            return incoming;
        }
        const stored = await this.decryptConfig(existing.config);
        return (0, config_redaction_1.restoreSecretConfig)(incoming, stored, secretFields);
    }
    async encryptConfig(config) {
        return await this.cipher.encryptV2(config);
    }
    async decryptConfig(encryptedConfig) {
        const decryptedData = await this.cipher.decryptV2(encryptedConfig);
        try {
            return (0, n8n_workflow_1.jsonParse)(decryptedData);
        }
        catch {
            throw new n8n_workflow_1.UnexpectedError('Credential resolver config could not be decrypted. The likely reason is that a different "encryptionKey" was used to encrypt the data.');
        }
    }
    async withDecryptedConfig(resolver) {
        resolver.decryptedConfig = await this.decryptConfig(resolver.config);
        return resolver;
    }
};
exports.DynamicCredentialResolverService = DynamicCredentialResolverService;
exports.DynamicCredentialResolverService = DynamicCredentialResolverService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, credential_resolver_repository_1.DynamicCredentialResolverRepository, credential_resolver_registry_service_1.DynamicCredentialResolverRegistry, n8n_core_1.Cipher, resolver_config_expression_service_1.ResolverConfigExpressionService, db_1.WorkflowRepository, active_workflow_manager_1.ActiveWorkflowManager])
], DynamicCredentialResolverService);
//# sourceMappingURL=credential-resolver.service.js.map