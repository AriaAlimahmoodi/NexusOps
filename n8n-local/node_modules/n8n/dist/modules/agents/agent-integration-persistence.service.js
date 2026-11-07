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
exports.AgentIntegrationPersistenceService = void 0;
exports.matchesIntegrationRef = matchesIntegrationRef;
const api_types_1 = require("@n8n/api-types");
const backend_services_1 = require("@n8n/backend-services");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const credentials_service_1 = require("../../credentials/credentials.service");
const agent_modification_telemetry_service_1 = require("./agent-modification-telemetry.service");
const agent_runtime_cache_service_1 = require("./agent-runtime-cache.service");
const agent_setup_completion_service_1 = require("./agent-setup-completion.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_document_1 = require("./json-config/agent-document");
const agent_chat_integration_1 = require("./integrations/agent-chat-integration");
const n8n_chat_flag_service_1 = require("./integrations/platforms/n8n-chat-flag.service");
const agent_repository_1 = require("./repositories/agent.repository");
const agent_credential_provider_1 = require("./utils/agent-credential-provider");
const MAX_WRITE_ATTEMPTS = 3;
function matchesIntegrationRef(integration, ref) {
    return integration.type === ref.type && integration.credentialId === ref.credentialId;
}
function projectIntegrations(current, delta) {
    let next = delta.remove
        ? current.filter((entry) => !matchesIntegrationRef(entry, delta.remove))
        : [...current];
    const { add } = delta;
    if (!add)
        return next;
    next = next.filter((entry) => !(entry.type === add.type && (0, api_types_1.isDraftIntegration)(entry)));
    if (!next.some((entry) => matchesIntegrationRef(entry, add)))
        return [...next, add];
    return next.map((entry) => (matchesIntegrationRef(entry, add) ? add : entry));
}
function toChatIntegrationDescriptor(i) {
    return {
        type: i.type,
        label: i.displayLabel,
        icon: i.displayIcon,
        credentialTypes: i.credentialTypes,
        approvableActions: i.actionToolDefinitions.map(({ name, sensitive }) => ({
            name,
            sensitive: sensitive === true,
        })),
        ...(i.builderGuidance
            ? {
                capabilities: i.builderGuidance.capabilities,
                useIntegrationWhen: i.builderGuidance.useIntegrationWhen,
                useNodeToolWhen: i.builderGuidance.useNodeToolWhen,
            }
            : {}),
    };
}
let AgentIntegrationPersistenceService = class AgentIntegrationPersistenceService {
    constructor(agentRepository, runtimeCacheService, chatIntegrationRegistry, eventService, modificationTelemetry, credentialsService, setupCompletionService, agentSkillRefs, n8nChatFlag) {
        this.agentRepository = agentRepository;
        this.runtimeCacheService = runtimeCacheService;
        this.chatIntegrationRegistry = chatIntegrationRegistry;
        this.eventService = eventService;
        this.modificationTelemetry = modificationTelemetry;
        this.credentialsService = credentialsService;
        this.setupCompletionService = setupCompletionService;
        this.agentSkillRefs = agentSkillRefs;
        this.n8nChatFlag = n8nChatFlag;
    }
    listChatIntegrations() {
        return this.chatIntegrationRegistry.listPublic().map(toChatIntegrationDescriptor);
    }
    async listBuilderChatIntegrations(user) {
        const integrations = this.listChatIntegrations();
        const n8nChat = this.chatIntegrationRegistry.get(api_types_1.N8N_CHAT_INTEGRATION_TYPE);
        if (!n8nChat || !(await this.n8nChatFlag.isEnabledFor(user)))
            return integrations;
        return [...integrations, toChatIntegrationDescriptor(n8nChat)];
    }
    async applyIntegrationDelta(agent, delta, context) {
        const add = delta.add ? this.validateAddition(delta.add) : undefined;
        const remove = delta.remove && add && matchesIntegrationRef(add, delta.remove) ? undefined : delta.remove;
        if (!add && !remove)
            return { agent, changed: false };
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, agent.projectId, context.user);
        for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
            const result = await this.applyIntegrationAttempt(agent, { add, remove }, context, credentialProvider);
            if (result)
                return result;
        }
        throw new n8n_workflow_1.OperationalError(`Could not update channels for agent "${agent.id}" — the agent kept changing underneath the write`);
    }
    validateAddition(integration) {
        const parseResult = api_types_1.AgentIntegrationConfigSchema.safeParse(integration);
        if (!parseResult.success) {
            throw new n8n_workflow_1.UserError(`Invalid credential integration: ${parseResult.error.message}`);
        }
        if ((0, api_types_1.isDraftIntegration)(parseResult.data)) {
            throw new n8n_workflow_1.UserError('Credential integration requires a credential ID.');
        }
        return parseResult.data;
    }
    recordIntegrationMutation(agent, skillRefs, previousIntegrations, context) {
        const config = agent.schema ? (0, agent_document_1.toAgentDocument)(agent.schema, skillRefs) : null;
        const wasUnconfigured = (0, agent_modification_telemetry_service_1.isUnconfiguredAgent)(config, previousIntegrations);
        this.modificationTelemetry.record({
            agent,
            config,
            projectId: agent.projectId,
            user: context.user,
            by: context.modifiedBy,
            changedParts: (0, agent_modification_telemetry_service_1.diffAgentConfigParts)(config, config, previousIntegrations, agent.integrations ?? []),
            wasUnconfigured,
        });
    }
    async applyIntegrationAttempt(agent, { add, remove }, context, credentialProvider) {
        const state = await this.agentRepository.findById(agent.id);
        if (!state)
            throw new n8n_workflow_1.UserError(`Agent "${agent.id}" no longer exists`);
        Object.assign(agent, state);
        const current = state.integrations ?? [];
        const removed = remove
            ? current.find((entry) => matchesIntegrationRef(entry, remove))
            : undefined;
        const published = state.activeVersionId !== null;
        if (!add && !removed) {
            return { agent, changed: false, published };
        }
        const integrations = projectIntegrations(current, { add, remove });
        const skillRefs = await this.agentSkillRefs.refsForDraft(agent, {});
        const written = await this.persistIntegrations(agent, skillRefs, integrations, state, context, credentialProvider);
        if (!written)
            return undefined;
        this.runtimeCacheService.clearRuntimes(agent.id);
        this.eventService.emit('agent-saved', { agentId: agent.id });
        await written.emitSetupCompleted?.();
        this.recordIntegrationMutation(agent, skillRefs, current, context);
        return { agent, changed: true, published, ...(removed ? { removed } : {}) };
    }
    async persistIntegrations(agent, skillRefs, integrations, state, context, credentialProvider) {
        const versionId = (0, uuid_1.v4)();
        agent.integrations = integrations;
        const emitSetupCompleted = await this.setupCompletionService.recordIfSetupComplete(agent, skillRefs, agent.projectId, credentialProvider, context.user);
        const written = await this.agentRepository.updateIntegrations(agent.id, integrations, {
            revision: state.revision,
            versionId: state.versionId,
            activeVersionId: state.activeVersionId,
        }, versionId);
        if (!written)
            return undefined;
        agent.versionId = versionId;
        agent.revision = state.revision + 1;
        return { emitSetupCompleted };
    }
};
exports.AgentIntegrationPersistenceService = AgentIntegrationPersistenceService;
exports.AgentIntegrationPersistenceService = AgentIntegrationPersistenceService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository, agent_runtime_cache_service_1.AgentRuntimeCacheService, agent_chat_integration_1.ChatIntegrationRegistry, backend_services_1.EventService, agent_modification_telemetry_service_1.AgentModificationTelemetryService, credentials_service_1.CredentialsService, agent_setup_completion_service_1.AgentSetupCompletionService, agent_skill_refs_service_1.AgentSkillRefsService, n8n_chat_flag_service_1.N8nChatFlagService])
], AgentIntegrationPersistenceService);
//# sourceMappingURL=agent-integration-persistence.service.js.map