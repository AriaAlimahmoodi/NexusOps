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
exports.SecretsProvidersConnectionsService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const credential_dependency_service_1 = require("../../credentials/credential-dependency.service");
const errors_1 = require("@n8n/errors");
const external_secrets_manager_ee_1 = require("../../modules/external-secrets.ee/external-secrets-manager.ee");
const redaction_service_ee_1 = require("../../modules/external-secrets.ee/redaction.service.ee");
const provider_registry_service_1 = require("./provider-registry.service");
let SecretsProvidersConnectionsService = class SecretsProvidersConnectionsService {
    constructor(logger, repository, projectAccessRepository, credentialDependencyService, providerRegistry, cipher, externalSecretsManager, redactionService, eventService) {
        this.logger = logger;
        this.repository = repository;
        this.projectAccessRepository = projectAccessRepository;
        this.credentialDependencyService = credentialDependencyService;
        this.providerRegistry = providerRegistry;
        this.cipher = cipher;
        this.externalSecretsManager = externalSecretsManager;
        this.redactionService = redactionService;
        this.eventService = eventService;
        this.logger = this.logger.scoped('external-secrets');
    }
    async createConnection(proposedConnection, userId, projectRole, userRole) {
        const existing = await this.repository.findOne({
            where: { providerKey: proposedConnection.providerKey },
        });
        if (existing) {
            throw new errors_1.BadRequestError(`Connection with key "${proposedConnection.providerKey}" already exists`);
        }
        const encryptedSettings = await this.encryptConnectionSettings(proposedConnection.settings);
        const connection = this.repository.create({
            ...proposedConnection,
            encryptedSettings,
            isEnabled: true,
        });
        const savedConnection = await this.repository.save(connection);
        if (proposedConnection.projectIds.length > 0) {
            const entries = proposedConnection.projectIds.map((projectId) => this.projectAccessRepository.create({
                secretsProviderConnectionId: savedConnection.id,
                projectId,
                role: projectRole,
            }));
            await this.projectAccessRepository.save(entries);
        }
        const result = (await this.repository.findOne({
            where: { providerKey: proposedConnection.providerKey },
        }));
        await this.externalSecretsManager.syncProviderConnection(proposedConnection.providerKey);
        this.eventService.emit('external-secrets-connection-created', {
            userId,
            userRole,
            providerKey: result.providerKey,
            vaultType: result.type,
            ...this.extractProjectInfo(result),
        });
        return result;
    }
    async updateProjectConnection(providerKey, updates, userId, userRole) {
        const connection = await this.findConnectionOrFail(providerKey);
        await this.applyConnectionUpdates(connection, updates);
        await this.repository.save(connection);
        return await this.syncAndEmitUpdate(providerKey, userId, userRole);
    }
    async updateGlobalConnection(providerKey, updates, userId, userRole) {
        const connection = await this.findConnectionOrFail(providerKey);
        await this.applyConnectionUpdates(connection, updates);
        await this.repository.save(connection);
        if (updates.projectIds !== undefined) {
            const existing = await this.projectAccessRepository.findByConnectionId(connection.id);
            const existingProjectIds = new Set(existing.map((e) => e.projectId));
            const desiredProjectIds = new Set(updates.projectIds);
            const projectIdsToRemove = existing
                .filter((e) => !desiredProjectIds.has(e.projectId))
                .map((e) => e.projectId);
            const entriesToAdd = updates.projectIds
                .filter((id) => !existingProjectIds.has(id))
                .map((projectId) => ({
                projectId,
                role: 'secretsProviderConnection:user',
            }));
            await this.projectAccessRepository.updateProjectAccess(connection.id, projectIdsToRemove, entriesToAdd);
        }
        return await this.syncAndEmitUpdate(providerKey, userId, userRole);
    }
    async applyConnectionUpdates(connection, updates) {
        if (updates.type !== undefined) {
            connection.type = updates.type;
            if (!updates.settings) {
                throw new errors_1.BadRequestError('When changing the connection type, new settings must be provided as well');
            }
        }
        if (updates.settings !== undefined) {
            const savedSettings = await this.decryptConnectionSettings(connection.encryptedSettings);
            const unredactedSettings = this.redactionService.unredact(updates.settings, savedSettings);
            connection.encryptedSettings = await this.encryptConnectionSettings(unredactedSettings);
        }
        if (updates.isEnabled !== undefined) {
            connection.isEnabled = updates.isEnabled;
        }
    }
    async syncAndEmitUpdate(providerKey, userId, userRole) {
        await this.externalSecretsManager.syncProviderConnection(providerKey);
        const result = (await this.repository.findOne({
            where: { providerKey },
        }));
        this.eventService.emit('external-secrets-connection-updated', {
            userId,
            userRole,
            providerKey: result.providerKey,
            vaultType: result.type,
            ...this.extractProjectInfo(result),
        });
        return result;
    }
    async deleteConnection(providerKey, userId, userRole) {
        const connection = await this.findConnectionOrFail(providerKey);
        const projectInfo = this.extractProjectInfo(connection);
        const dependencyId = connection.id.toString();
        await this.repository.manager.transaction(async (entityManager) => {
            await this.projectAccessRepository.deleteByConnectionId(connection.id, entityManager);
            await this.credentialDependencyService.deleteDependencyById({
                dependencyType: credential_dependency_service_1.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE,
                dependencyId,
                entityManager,
            });
            await entityManager.delete(this.repository.target, { id: connection.id });
        });
        await this.externalSecretsManager.syncProviderConnection(providerKey);
        this.eventService.emit('external-secrets-connection-deleted', {
            userId,
            userRole,
            providerKey: connection.providerKey,
            vaultType: connection.type,
            ...projectInfo,
        });
        return connection;
    }
    async findConnectionOrFail(providerKey) {
        const connection = await this.repository.findOne({ where: { providerKey } });
        if (!connection) {
            throw new errors_1.NotFoundError(`Connection with key "${providerKey}" not found`);
        }
        return connection;
    }
    async getConnection(providerKey) {
        const connection = await this.repository.findOne({ where: { providerKey } });
        if (!connection) {
            throw new errors_1.NotFoundError(`Connection with key "${providerKey}" not found`);
        }
        return connection;
    }
    async listConnections() {
        return await this.repository.findAll();
    }
    async getGlobalCompletions() {
        const connectedProviderKeys = this.providerRegistry.getConnectedNames();
        return await this.repository.findEnabledGlobalConnections({
            providerKeys: connectedProviderKeys,
        });
    }
    async getProjectCompletions(projectId) {
        const connectedProviderKeys = this.providerRegistry.getConnectedNames();
        return await this.repository.findEnabledByProjectId(projectId, {
            providerKeys: connectedProviderKeys,
        });
    }
    async listConnectionsForProject(projectId) {
        return await this.repository.findAllAccessibleByProjectWithProjectAccess(projectId);
    }
    toSecretCompletionsResponse(connections) {
        return Object.fromEntries(connections.map((connection) => [
            connection.providerKey,
            this.externalSecretsManager.getSecretNames(connection.providerKey),
        ]));
    }
    toPublicConnectionListItem(connection) {
        const secretNames = this.externalSecretsManager.getSecretNames(connection.providerKey);
        const connectionInstance = this.externalSecretsManager.getProvider(connection.providerKey);
        return {
            id: String(connection.id),
            name: connection.providerKey,
            type: connection.type,
            isEnabled: connection.isEnabled,
            secretsCount: secretNames.length,
            state: connectionInstance?.state ?? 'initializing',
            projects: connection.projectAccess.map((access) => ({
                id: access.project.id,
                name: access.project.name,
                role: access.role,
            })),
            createdAt: connection.createdAt.toISOString(),
            updatedAt: connection.updatedAt.toISOString(),
        };
    }
    async toPublicConnection(connection) {
        const decryptedSettings = await this.decryptConnectionSettings(connection.encryptedSettings);
        const properties = this.externalSecretsManager.getProviderProperties(connection.type);
        const redactedSettings = this.redactionService.redact(decryptedSettings, properties);
        const secretNames = this.externalSecretsManager.getSecretNames(connection.providerKey);
        const connectionInstance = this.externalSecretsManager.getProvider(connection.providerKey);
        return {
            id: String(connection.id),
            name: connection.providerKey,
            type: connection.type,
            isEnabled: connection.isEnabled,
            secretsCount: secretNames.length,
            state: connectionInstance?.state ?? 'initializing',
            secrets: secretNames.map((name) => ({ name })),
            projects: connection.projectAccess.map((access) => ({
                id: access.project.id,
                name: access.project.name,
                role: access.role,
            })),
            settings: redactedSettings,
            createdAt: connection.createdAt.toISOString(),
            updatedAt: connection.updatedAt.toISOString(),
        };
    }
    async testConnection(providerKey, userId, userRole) {
        const connection = await this.getConnection(providerKey);
        const decryptedSettings = await this.decryptConnectionSettings(connection.encryptedSettings);
        const result = await this.externalSecretsManager.testProviderSettings(connection.type, decryptedSettings);
        const response = api_types_1.testSecretProviderConnectionResponseSchema.parse(result);
        this.eventService.emit('external-secrets-connection-tested', {
            userId,
            userRole,
            providerKey: connection.providerKey,
            vaultType: connection.type,
            ...this.extractProjectInfo(connection),
            isValid: response.success,
            ...(response.error && { errorMessage: response.error }),
        });
        return response;
    }
    async reloadConnectionSecrets(providerKey, userId, userRole) {
        try {
            const connection = await this.getConnection(providerKey);
            await this.externalSecretsManager.updateProvider(providerKey);
            this.eventService.emit('external-secrets-connection-reloaded', {
                userId,
                userRole,
                providerKey: connection.providerKey,
                vaultType: connection.type,
                ...this.extractProjectInfo(connection),
            });
            return api_types_1.reloadSecretProviderConnectionResponseSchema.parse({ success: true });
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            this.logger.warn(`Failed to reload provider ${providerKey}`, { providerKey });
            return api_types_1.reloadSecretProviderConnectionResponseSchema.parse({ success: false });
        }
    }
    extractProjectInfo(connection) {
        return {
            projects: connection.projectAccess.map((access) => ({
                id: access.project.id,
                name: access.project.name,
            })),
        };
    }
    async cleanupConnectionsForProjectDeletion(projectId) {
        const accessEntries = await this.projectAccessRepository.findByProjectId(projectId);
        const providerKeysToSync = new Set();
        const ownerConnectionIds = new Set();
        const nonOwnerConnectionIds = new Set();
        for (const access of accessEntries) {
            providerKeysToSync.add(access.secretsProviderConnection.providerKey);
            if (access.role === 'secretsProviderConnection:owner') {
                ownerConnectionIds.add(access.secretsProviderConnectionId);
            }
            else {
                nonOwnerConnectionIds.add(access.secretsProviderConnectionId);
            }
        }
        await this.repository.manager.transaction(async (entityManager) => {
            if (ownerConnectionIds.size > 0) {
                await this.credentialDependencyService.deleteDependenciesByIds({
                    dependencyType: credential_dependency_service_1.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE,
                    dependencyIds: [...ownerConnectionIds].map((id) => id.toString()),
                    entityManager,
                });
                await entityManager.delete(this.repository.target, { id: (0, typeorm_1.In)([...ownerConnectionIds]) });
            }
            if (nonOwnerConnectionIds.size > 0) {
                await entityManager.delete(this.projectAccessRepository.target, {
                    projectId,
                    secretsProviderConnectionId: (0, typeorm_1.In)([...nonOwnerConnectionIds]),
                });
                await entityManager.update(this.repository.target, { id: (0, typeorm_1.In)([...nonOwnerConnectionIds]) }, { isEnabled: false });
            }
        });
        for (const providerKey of providerKeysToSync) {
            await this.externalSecretsManager.syncProviderConnection(providerKey);
        }
    }
    async encryptConnectionSettings(settings) {
        return await this.cipher.encryptV2(settings);
    }
    async getConnectionForProject(providerKey, projectId) {
        const connection = await this.repository.findByProviderKeyAndProjectId(providerKey, projectId);
        if (!connection) {
            throw new errors_1.NotFoundError(`Connection with key "${providerKey}" not found`);
        }
        return connection;
    }
    async getConnectionAccessibleFromProject(providerKey, projectId) {
        const connection = await this.repository.findAccessibleByProviderKeyAndProjectId(providerKey, projectId);
        if (!connection) {
            throw new errors_1.NotFoundError(`Connection with key "${providerKey}" not found`);
        }
        return connection;
    }
    async deleteConnectionForProject(providerKey, projectId) {
        const connection = await this.repository.findByProviderKeyAndProjectId(providerKey, projectId);
        if (!connection) {
            throw new errors_1.NotFoundError(`Connection with key "${providerKey}" not found`);
        }
        const connectionId = connection.id;
        await this.credentialDependencyService.deleteDependencyById({
            dependencyType: credential_dependency_service_1.EXTERNAL_SECRET_PROVIDER_DEPENDENCY_TYPE,
            dependencyId: connectionId.toString(),
        });
        await this.projectAccessRepository.deleteByConnectionId(connectionId);
        await this.repository.delete({ id: connectionId });
        await this.externalSecretsManager.syncProviderConnection(providerKey);
        return connection;
    }
    async decryptConnectionSettings(encryptedSettings) {
        const decrypted = await this.cipher.decryptV2(encryptedSettings);
        const parsed = (0, n8n_workflow_1.jsonParse)(decrypted);
        return parsed;
    }
};
exports.SecretsProvidersConnectionsService = SecretsProvidersConnectionsService;
exports.SecretsProvidersConnectionsService = SecretsProvidersConnectionsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.SecretsProviderConnectionRepository, db_1.ProjectSecretsProviderAccessRepository, credential_dependency_service_1.CredentialDependencyService, provider_registry_service_1.ExternalSecretsProviderRegistry, n8n_core_1.Cipher, external_secrets_manager_ee_1.ExternalSecretsManager, redaction_service_ee_1.RedactionService, backend_services_1.EventService])
], SecretsProvidersConnectionsService);
//# sourceMappingURL=secrets-providers-connections.service.ee.js.map