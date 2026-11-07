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
exports.AgentIntegrationManagementService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const run_serially_1 = require("@n8n/utils/run-serially");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const agent_integration_persistence_service_1 = require("./agent-integration-persistence.service");
const agent_update_broadcaster_1 = require("./agent-update-broadcaster");
const agent_chat_integration_1 = require("./integrations/agent-chat-integration");
const chat_integration_service_1 = require("./integrations/chat-integration.service");
const agent_repository_1 = require("./repositories/agent.repository");
let AgentIntegrationManagementService = class AgentIntegrationManagementService {
    constructor(persistenceService, credentialsService, chatService, registry, logger, agentRepository, agentUpdateBroadcaster) {
        this.persistenceService = persistenceService;
        this.credentialsService = credentialsService;
        this.chatService = chatService;
        this.registry = registry;
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.agentUpdateBroadcaster = agentUpdateBroadcaster;
        this.mutations = new Map();
    }
    async validateConfig(integration) {
        const parsed = await api_types_1.AgentIntegrationConfigSchema.safeParseAsync(integration);
        if (!parsed.success)
            throw new errors_1.BadRequestError(parsed.error.message);
        const result = parsed.data;
        this.registry.require(result.type).validateConfig?.(result);
        return result;
    }
    async connect(options) {
        const integration = await this.validateConfig(options.integration);
        if ((0, api_types_1.isCredentialAgentIntegration)(integration)) {
            await this.assertUsableCredential(options.agent, options.user, integration);
        }
        const result = await this.applyChange({
            agent: options.agent,
            user: options.user,
            add: integration,
            ...(options.replaces ? { remove: options.replaces } : {}),
            modifiedBy: options.modifiedBy ?? 'user',
            pushRef: options.pushRef,
        });
        return { integration, savedAgent: result.agent };
    }
    async disconnect(options) {
        const result = await this.applyChange({
            agent: options.agent,
            user: options.user,
            remove: { type: options.type, credentialId: options.credentialId },
            cleanupRemovedIntegration: true,
            deleteExternalResource: options.deleteExternalResource,
            modifiedBy: options.modifiedBy ?? 'user',
            pushRef: options.pushRef,
        });
        return {
            savedAgent: result.agent,
            ...(result.warning ? { warning: result.warning } : {}),
        };
    }
    async applyChange(options) {
        return await (0, run_serially_1.runSerially)(this.mutations, options.agent.id, async () => await this.runChange(options));
    }
    async runChange(options) {
        const { agent, add } = options;
        const remove = options.remove && add && (0, agent_integration_persistence_service_1.matchesIntegrationRef)(add, options.remove)
            ? undefined
            : options.remove;
        const previous = await this.loadRuntimeBeforeChange(options);
        let connected = await this.startAddedRuntime(options, previous);
        const result = await this.persistChange(options, remove, connected, previous);
        if (result.changed) {
            this.agentUpdateBroadcaster.notify({ projectId: agent.projectId, agentId: agent.id, source: options.modifiedBy }, options.pushRef);
        }
        if (add && (0, api_types_1.isCredentialAgentIntegration)(add) && result.published !== undefined) {
            connected = await this.reconcileRuntimeWithPublication(agent, add, connected, result.published);
        }
        const warning = await this.cleanupRemovedIntegration(options, remove, result, previous.published);
        if (connected && add) {
            await this.chatService.broadcastIntegrationChange(agent.id, add, 'connect');
        }
        return { ...result, ...(warning ? { warning } : {}) };
    }
    async cleanupRemovedIntegration(options, remove, result, publishedBefore) {
        const { agent } = options;
        const isPublished = result.published ?? publishedBefore;
        try {
            if (!result.removed || !options.cleanupRemovedIntegration)
                return undefined;
            return await this.registry.get(result.removed.type)?.onRemove?.({
                agentId: agent.id,
                projectId: agent.projectId,
                credentialId: result.removed.credentialId,
                user: options.user,
                deleteExternalResource: options.deleteExternalResource ?? !isPublished,
            });
        }
        finally {
            if (remove)
                await this.releaseRemoved(agent, remove, result);
        }
    }
    async persistChange(options, remove, connected, previous) {
        const { agent, add } = options;
        try {
            return await this.persistenceService.applyIntegrationDelta(agent, { add, remove }, { user: options.user, modifiedBy: options.modifiedBy });
        }
        catch (error) {
            if (!connected || !add)
                throw error;
            if (previous.wasLive && previous.persisted) {
                await this.restorePersistedRuntime(agent, previous.persisted);
            }
            else {
                await this.releaseRuntimeQuietly(agent, add);
            }
            throw error;
        }
    }
    async startAddedRuntime({ agent, add }, previous) {
        if (!add)
            return false;
        try {
            return await this.startRuntime(agent, add, previous.published);
        }
        catch (error) {
            if (previous.wasLive)
                await this.restorePersistedRuntime(agent, previous.persisted);
            throw error;
        }
    }
    async loadRuntimeBeforeChange({ agent, add, cleanupRemovedIntegration, }) {
        const state = add || cleanupRemovedIntegration
            ? await this.agentRepository.findIntegrationState(agent.id)
            : null;
        const published = state ? state.activeVersionId !== null : agent.activeVersionId !== null;
        const wasLive = !!add && published && this.chatService.isChannelLive(agent.id, add);
        const persisted = add && state
            ? (state.integrations ?? []).find((entry) => (0, agent_integration_persistence_service_1.matchesIntegrationRef)(entry, add))
            : undefined;
        return { published, wasLive, persisted };
    }
    async reconcileRuntimeWithPublication(agent, add, connected, published) {
        if (connected && !published) {
            this.logger.info('[AgentIntegrationManagementService] Agent was unpublished while its channel connected — releasing the runtime', { agentId: agent.id, type: add.type });
            await this.chatService.disconnectChannel(agent.id, add, { deleteSubscriptions: false });
            return false;
        }
        if (connected && published && !this.chatService.isChannelLive(agent.id, add)) {
            this.logger.info('[AgentIntegrationManagementService] Channel runtime went away while the mutation was in flight — restarting it', { agentId: agent.id, type: add.type });
            return await this.startRuntimeQuietly(agent, add);
        }
        if (!connected && published) {
            this.logger.info('[AgentIntegrationManagementService] Agent was published while its channel persisted — starting the runtime', { agentId: agent.id, type: add.type });
            return await this.startRuntimeQuietly(agent, add);
        }
        return connected;
    }
    async startRuntimeQuietly(agent, add) {
        try {
            return await this.startRuntime(agent, add, true);
        }
        catch (error) {
            this.logger.warn('[AgentIntegrationManagementService] Could not start the channel runtime', {
                agentId: agent.id,
                type: add.type,
                error,
            });
            return false;
        }
    }
    async startRuntime(agent, add, published) {
        if (!(0, api_types_1.isCredentialAgentIntegration)(add))
            return false;
        if (!published) {
            await this.chatService.validateBeforeConnect(agent.id, add, agent.projectId);
            return false;
        }
        await this.chatService.connect(agent.id, add, agent.projectId);
        return true;
    }
    async restorePersistedRuntime(agent, persisted) {
        if (!persisted)
            return;
        try {
            await this.chatService.connect(agent.id, persisted, agent.projectId);
        }
        catch (error) {
            this.logger.warn('[AgentIntegrationManagementService] Could not restore the previous channel runtime', { agentId: agent.id, type: persisted.type, error });
        }
    }
    async releaseRemoved(agent, remove, result) {
        if (result.removed) {
            await this.chatService.disconnectChannel(agent.id, result.removed);
            return;
        }
        this.logger.debug('[AgentIntegrationManagementService] No persisted channel matched the removal — clearing runtime only', { agentId: agent.id, type: remove.type });
        await this.releaseRuntimeQuietly(agent, remove);
        const parsed = api_types_1.AgentIntegrationSchema.safeParse(remove);
        if (parsed.success) {
            await this.chatService.broadcastIntegrationChange(agent.id, parsed.data, 'disconnect');
        }
    }
    async releaseRuntimeQuietly(agent, integration) {
        try {
            await this.chatService.disconnect(agent.id, integration);
        }
        catch (error) {
            this.logger.warn('[AgentIntegrationManagementService] Could not release the channel runtime', {
                agentId: agent.id,
                type: integration.type,
                error,
            });
        }
    }
    async assertUsableCredential(agent, user, integration) {
        const implementation = this.registry.require(integration.type);
        const usableCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, { projectId: agent.projectId, excludePersonalRoute: true });
        const credential = usableCredentials.find((item) => item.id === integration.credentialId);
        if (!credential) {
            throw new errors_1.NotFoundError(`Credential "${integration.credentialId}" not found`);
        }
        if (!implementation.credentialTypes.includes(credential.type)) {
            throw new errors_1.BadRequestError(`${implementation.displayLabel} integrations do not support ${credential.type} credentials`);
        }
    }
};
exports.AgentIntegrationManagementService = AgentIntegrationManagementService;
exports.AgentIntegrationManagementService = AgentIntegrationManagementService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_integration_persistence_service_1.AgentIntegrationPersistenceService, credentials_service_1.CredentialsService, chat_integration_service_1.ChatIntegrationService, agent_chat_integration_1.ChatIntegrationRegistry, backend_common_1.Logger, agent_repository_1.AgentRepository, agent_update_broadcaster_1.AgentUpdateBroadcaster])
], AgentIntegrationManagementService);
//# sourceMappingURL=agent-integration-management.service.js.map