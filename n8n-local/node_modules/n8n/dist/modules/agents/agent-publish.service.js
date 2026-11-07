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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPublishService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const telemetry_1 = require("@n8n/telemetry");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const credentials_service_1 = require("../../credentials/credentials.service");
const errors_1 = require("@n8n/errors");
const telemetry_2 = require("../../telemetry");
const agents_credential_provider_1 = require("./adapters/agents-credential-provider");
const agent_definition_service_1 = require("./agent-definition.service");
const agent_save_completion_service_1 = require("./agent-save-completion.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_custom_tools_service_1 = require("./agent-custom-tools.service");
const agent_telemetry_1 = require("./agent-telemetry");
const agent_modification_telemetry_service_1 = require("./agent-modification-telemetry.service");
const agent_policy_service_1 = require("./agent-policy.service");
const agent_runtime_cache_service_1 = require("./agent-runtime-cache.service");
const agent_setup_completion_service_1 = require("./agent-setup-completion.service");
const agent_update_broadcaster_1 = require("./agent-update-broadcaster");
const agent_validation_service_1 = require("./agent-validation.service");
const chat_integration_service_1 = require("./integrations/chat-integration.service");
const agent_document_1 = require("./json-config/agent-document");
const agent_history_repository_1 = require("./repositories/agent-history.repository");
const agent_task_snapshot_repository_1 = require("./repositories/agent-task-snapshot.repository");
const agent_task_repository_1 = require("./repositories/agent-task.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
function requireValidValidation(validation) {
    if (validation.status !== 'valid') {
        const unpublishedWorkflows = validation.issues
            .filter((issue) => issue.reason === 'not_published')
            .map(({ capability }) => `workflow "${capability.id}" is not published`);
        if (unpublishedWorkflows.length > 0) {
            throw new n8n_workflow_1.UserError(`Cannot publish agent: ${unpublishedWorkflows.join('; ')}. Publish these workflows first.`);
        }
        throw new n8n_workflow_1.UserError('Agent configuration has errors that must be resolved before publishing');
    }
}
function draftSchemaFromVersion(schema) {
    if (!schema)
        return null;
    const draft = { ...schema };
    delete draft.integrations;
    return draft;
}
let AgentPublishService = class AgentPublishService {
    constructor(logger, agentRepository, agentHistoryRepository, agentTaskSnapshotRepository, agentTaskRepository, customToolsService, runtimeCacheService, agentValidationService, credentialsService, telemetry, eventService, setupCompletionService, agentUpdateBroadcaster, transactionRunner, saveCompletion, definitionService, agentPolicyService, agentSkillRefs) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.agentHistoryRepository = agentHistoryRepository;
        this.agentTaskSnapshotRepository = agentTaskSnapshotRepository;
        this.agentTaskRepository = agentTaskRepository;
        this.customToolsService = customToolsService;
        this.runtimeCacheService = runtimeCacheService;
        this.agentValidationService = agentValidationService;
        this.credentialsService = credentialsService;
        this.telemetry = telemetry;
        this.eventService = eventService;
        this.setupCompletionService = setupCompletionService;
        this.agentUpdateBroadcaster = agentUpdateBroadcaster;
        this.transactionRunner = transactionRunner;
        this.saveCompletion = saveCompletion;
        this.definitionService = definitionService;
        this.agentPolicyService = agentPolicyService;
        this.agentSkillRefs = agentSkillRefs;
    }
    async publishAgent(agentId, projectId, user, emitter, versionId, pushRef) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const expectedRevision = agent.revision;
        if (!versionId && agent.versionId !== null && agent.versionId === agent.activeVersionId) {
            return { agent };
        }
        if (versionId !== undefined && versionId === agent.activeVersionId) {
            return { agent };
        }
        const targetHistory = await this.findPublishTarget(versionId, agent.id);
        const tasks = versionId
            ? new Map()
            : new Map((await this.agentTaskRepository.findByAgentId(agentId)).map((task) => [task.id, task]));
        const validation = await this.assertPublishable(agent, projectId, user, tasks, targetHistory);
        const published = await this.readPublishTargetDocument(agent, targetHistory);
        const emitSetupCompleted = this.setupCompletionService.recordPublishedSetupComplete(agent, projectId, user, published);
        await this.commitPublication(agent, expectedRevision, user, tasks, targetHistory);
        this.eventService.emit('agent-saved', { agentId });
        this.agentUpdateBroadcaster.notify({ projectId, agentId, source: emitter.by }, pushRef);
        this.runtimeCacheService.clearRuntimes(agentId);
        this.trackPublished(agent, projectId, user, emitter, targetHistory, published);
        await emitSetupCompleted?.();
        await this.startPublishedServices(agent);
        this.logger.debug('Published SDK agent', { agentId, projectId, userId: user.id });
        return versionId ? { agent } : { agent, draftValidation: validation };
    }
    async assertPublishable(agent, projectId, user, tasks, targetHistory) {
        const schema = targetHistory ? targetHistory.schema : agent.schema;
        if (schema) {
            await this.agentPolicyService.enforcePublish(projectId, agent.id, schema, {
                kind: 'user',
                user,
            });
        }
        const credentialProvider = new agents_credential_provider_1.AgentsCredentialProvider(this.credentialsService, projectId, user, agent.id);
        const validation = targetHistory
            ? await this.agentValidationService.validateAgentHistoryConfiguration(agent.id, projectId, targetHistory, agent.integrations ?? [], credentialProvider)
            : await this.agentValidationService.validateAgentEntityConfiguration(agent, await this.agentSkillRefs.refsForDraft(agent, {}), projectId, tasks, credentialProvider);
        requireValidValidation(validation);
        await this.assertChannelsStartable(agent, projectId);
        return validation;
    }
    async assertChannelsStartable(agent, projectId) {
        const chatIntegrationService = di_1.Container.get(chat_integration_service_1.ChatIntegrationService);
        for (const integration of agent.integrations ?? []) {
            if (!(0, api_types_1.isCredentialAgentIntegration)(integration))
                continue;
            if ((0, api_types_1.isDraftIntegration)(integration))
                continue;
            await chatIntegrationService.assertStartupPreconditions(agent.id, integration, projectId);
        }
    }
    async unpublishAgent(agentId, projectId, user, by, pushRef) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const expectedRevision = agent.revision;
        await this.commitUnpublication(agent, expectedRevision);
        this.eventService.emit('agent-saved', { agentId });
        this.agentUpdateBroadcaster.notify({ projectId, agentId, source: by }, pushRef);
        this.runtimeCacheService.clearRuntimes(agentId);
        this.trackUnpublished(agentId, projectId, user, by);
        const chatIntegrationService = di_1.Container.get(chat_integration_service_1.ChatIntegrationService);
        for (const integration of agent.integrations ?? []) {
            await chatIntegrationService.disconnectChannel(agentId, integration, {
                deleteSubscriptions: false,
            });
        }
        const { AgentTaskService } = await import('./agent-task.service.js');
        await di_1.Container.get(AgentTaskService)
            .requestReconcile(agentId)
            .catch((error) => this.logger.warn('Failed to stop agent tasks on unpublish', { agentId, error }));
        this.logger.debug('Unpublished SDK agent', { agentId, projectId });
        return agent;
    }
    trackPublished(agent, projectId, user, emitter, targetHistory, published) {
        const properties = {
            agent_id: agent.id,
            project_id: projectId,
            user_id: user.id,
            trigger: targetHistory ? 'republish' : emitter.trigger,
            version_id: agent.activeVersionId,
            ...(0, agent_telemetry_1.buildAgentCapabilityTelemetryProperties)(published, agent.integrations),
        };
        switch (emitter.by) {
            case 'user':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_PUBLISHED_AGENT, {
                    ...properties,
                    event_version: '2',
                });
                return;
            case 'builder':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_PUBLISHED_AGENT, {
                    ...properties,
                    event_version: '1',
                });
                return;
            case 'mcp':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.MCP_PUBLISHED_AGENT, {
                    ...properties,
                    event_version: '1',
                });
        }
    }
    trackUnpublished(agentId, projectId, user, by) {
        const properties = { agent_id: agentId, project_id: projectId, user_id: user.id };
        switch (by) {
            case 'user':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.USER_UNPUBLISHED_AGENT, {
                    ...properties,
                    event_version: '2',
                });
                return;
            case 'builder':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.BUILDER_UNPUBLISHED_AGENT, {
                    ...properties,
                    event_version: '1',
                });
                return;
            case 'mcp':
                this.telemetry.track(telemetry_1.TELEMETRY_EVENT.AGENTS.MCP_UNPUBLISHED_AGENT, {
                    ...properties,
                    event_version: '1',
                });
        }
    }
    async revertToPublishedAgent(agentId, projectId, user, modifiedBy, pushRef) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const activeVersion = agent.activeVersion;
        if (!activeVersion) {
            throw new errors_1.ConflictError(`Agent "${agentId}" is not published`);
        }
        await this.restoreVersion(agent, activeVersion, activeVersion.versionId, {
            user,
            modifiedBy,
            pushRef,
        });
        this.logger.debug('Reverted SDK agent to published version', { agentId, projectId });
        return agent;
    }
    async revertToVersion(agentId, projectId, versionId, user, modifiedBy, pushRef) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const version = await this.agentHistoryRepository.findByVersionAndAgentId(versionId, agentId);
        if (!version)
            throw new errors_1.NotFoundError(`Version "${versionId}" not found`);
        await this.restoreVersion(agent, version, (0, uuid_1.v4)(), { user, modifiedBy, pushRef });
        this.logger.debug('Reverted SDK agent to a specific version', {
            agentId,
            projectId,
            versionId,
        });
        return agent;
    }
    async enforceRevertPolicy(agent, user, schema) {
        if (!schema)
            return;
        await this.agentPolicyService.enforceSave(agent.projectId, agent.id, schema, agent.schema, {
            kind: 'user',
            user,
        });
    }
    async restoreVersion(agent, version, nextVersionId, context) {
        await this.enforceRevertPolicy(agent, context.user, version.schema);
        const previousSkillRefs = await this.agentSkillRefs.refsForDraft(agent, {});
        const previousSkills = structuredClone(agent.skills ?? {});
        const previousSchema = agent.schema ? (0, agent_document_1.toAgentDocument)(agent.schema, previousSkillRefs) : null;
        const previousTools = agent.tools ?? {};
        const { tasksChanged, nextSchema, nextSkillRefs } = await this.transactionRunner.run({}, async (ctx) => {
            const definition = await this.definitionService.readVersion(version, ctx);
            definition.schema = draftSchemaFromVersion(definition.schema);
            agent.versionId = nextVersionId;
            const changed = await this.definitionService.replaceDraft(agent, definition, ctx, version);
            return {
                tasksChanged: changed,
                nextSchema: definition.schema,
                nextSkillRefs: await this.agentSkillRefs.refsForDraft(agent, ctx),
            };
        });
        const integrations = agent.integrations ?? [];
        await this.saveCompletion.configurationSaved({
            agent,
            config: nextSchema,
            projectId: agent.projectId,
            user: context.user,
            by: context.modifiedBy,
            changedParts: (0, agent_modification_telemetry_service_1.diffAgentConfigParts)(previousSchema, nextSchema, integrations, integrations, {
                tools: !(0, isEqual_1.default)(previousTools, agent.tools),
                skills: !(0, isEqual_1.default)(previousSkillRefs, nextSkillRefs) ||
                    (!this.agentSkillRefs.usesSkillsHub && !(0, isEqual_1.default)(previousSkills, agent.skills ?? {})),
                tasks: tasksChanged,
            }),
            wasUnconfigured: false,
        }, context.pushRef, null);
    }
    async hasPublishHistory(agentId) {
        return await this.agentHistoryRepository.existsForAgent(agentId);
    }
    async getVersion(agentId, projectId, versionId) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const version = await this.agentHistoryRepository.findByVersionAndAgentId(versionId, agentId);
        if (!version) {
            throw new errors_1.NotFoundError(`Version "${versionId}" not found for agent "${agentId}"`);
        }
        const definition = await this.definitionService.readVersion(version);
        return { agent, version, definition };
    }
    async listPublishHistory(agentId, projectId, take, skip) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId);
        const versions = await this.agentHistoryRepository.findByAgentId(agentId, take, skip);
        return versions.map((v) => ({
            versionId: v.versionId,
            agentId: v.agentId,
            createdAt: v.createdAt.toISOString(),
            updatedAt: v.updatedAt.toISOString(),
            author: v.author,
            isActive: v.versionId === agent.activeVersionId,
        }));
    }
    async snapshotConfiguredTasks(ctx, versionId, config, tasks) {
        if (!config)
            return;
        const refs = config.tasks ?? [];
        if (refs.length === 0)
            return;
        const missing = refs.filter((ref) => !tasks.has(ref.id)).map((ref) => ref.id);
        if (missing.length > 0) {
            throw new n8n_workflow_1.UserError(`Cannot publish agent with missing task bodies: ${missing.join(', ')}`);
        }
        await this.agentTaskSnapshotRepository.saveForVersion(refs.map((ref) => {
            const body = tasks.get(ref.id);
            if (!body) {
                throw new n8n_workflow_1.UserError(`Cannot publish agent with missing task body: ${ref.id}`);
            }
            return {
                versionId,
                taskId: ref.id,
                enabled: ref.enabled,
                name: body.name,
                objective: body.objective,
                cronExpression: body.cronExpression,
                timezone: body.timezone,
            };
        }), ctx);
    }
    async readPublishTargetDocument(agent, targetHistory) {
        if (targetHistory) {
            return targetHistory.schema
                ? (0, agent_document_1.toAgentDocument)(targetHistory.schema, await this.agentSkillRefs.refsForVersion(targetHistory, {}))
                : null;
        }
        return agent.schema
            ? (0, agent_document_1.toAgentDocument)(agent.schema, await this.agentSkillRefs.refsForDraft(agent, {}))
            : null;
    }
    async startPublishedServices(agent) {
        const agentId = agent.id;
        const credentialIntegrations = (agent.integrations ?? []).filter(api_types_1.isCredentialAgentIntegration);
        if (credentialIntegrations.length > 0) {
            await di_1.Container.get(chat_integration_service_1.ChatIntegrationService)
                .syncToConfig(agent, [], credentialIntegrations)
                .catch((error) => this.logger.warn('Failed to connect integrations on publish', {
                agentId,
                error,
            }));
        }
        const { AgentTaskService } = await import('./agent-task.service.js');
        await di_1.Container.get(AgentTaskService)
            .requestReconcile(agentId)
            .catch((error) => this.logger.warn('Failed to register agent tasks on publish', { agentId, error }));
    }
    async commitUnpublication(agent, expectedRevision) {
        await this.transactionRunner.run({}, async (ctx) => {
            const nextVersionId = (0, uuid_1.v4)();
            const won = await this.agentRepository.setActiveVersionFenced(agent.id, expectedRevision, { activeVersionId: null, versionId: nextVersionId }, ctx);
            if (!won) {
                throw new errors_1.ConflictError('Agent was modified concurrently while unpublishing; please retry');
            }
            agent.activeVersionId = null;
            agent.activeVersion = null;
            agent.versionId = nextVersionId;
            agent.revision = expectedRevision + 1;
        });
    }
    async findPublishTarget(versionId, agentId) {
        if (!versionId)
            return undefined;
        const target = await this.agentHistoryRepository.findByVersionAndAgentId(versionId, agentId);
        if (!target)
            throw new errors_1.NotFoundError(`Version "${versionId}" not found for agent "${agentId}"`);
        return target;
    }
    async commitPublication(agent, expectedRevision, user, tasks, targetHistory) {
        await this.transactionRunner.run({}, async (ctx) => {
            const next = await this.preparePublishedVersion(ctx, agent, user, tasks, targetHistory);
            const won = await this.agentRepository.setActiveVersionFenced(agent.id, expectedRevision, { activeVersionId: next.activeVersionId, versionId: next.versionId }, ctx);
            if (!won)
                throw new errors_1.ConflictError('Agent was modified concurrently while publishing; please retry');
            agent.activeVersionId = next.activeVersionId;
            agent.activeVersion = next.activeVersion;
            agent.versionId = next.versionId;
            agent.revision = expectedRevision + 1;
        });
    }
    async preparePublishedVersion(ctx, agent, user, tasks, targetHistory) {
        if (targetHistory) {
            return {
                activeVersionId: targetHistory.versionId,
                activeVersion: targetHistory,
                versionId: (0, uuid_1.v4)(),
            };
        }
        const versionId = agent.versionId ?? (0, uuid_1.v4)();
        const activeVersion = await this.saveDraftHistory(ctx, agent, user, versionId);
        await this.snapshotConfiguredTasks(ctx, versionId, agent.schema, tasks);
        return { activeVersionId: versionId, activeVersion, versionId };
    }
    async saveDraftHistory(ctx, agent, user, versionId) {
        try {
            const snapshot = await this.agentSkillRefs.versionSnapshot(agent, ctx);
            const { schema, skills } = snapshot;
            const history = await this.agentHistoryRepository.saveVersion({
                versionId,
                agentId: agent.id,
                schema: schema
                    ? {
                        ...schema,
                        integrations: (agent.integrations ?? []).filter((integration) => integration.type === api_types_1.N8N_CHAT_INTEGRATION_TYPE),
                    }
                    : null,
                tools: this.customToolsService.snapshotConfiguredTools(agent.schema, agent.tools ?? {}),
                skills,
                publishedBy: user,
            }, ctx);
            await this.agentSkillRefs.pinVersion(versionId, snapshot, ctx);
            return history;
        }
        catch (error) {
            if ((0, db_1.isUniqueConstraintError)(error)) {
                throw new errors_1.ConflictError('Agent was modified concurrently while publishing; please retry');
            }
            throw error;
        }
    }
};
exports.AgentPublishService = AgentPublishService;
exports.AgentPublishService = AgentPublishService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_history_repository_1.AgentHistoryRepository, agent_task_snapshot_repository_1.AgentTaskSnapshotRepository, agent_task_repository_1.AgentTaskRepository, agent_custom_tools_service_1.AgentCustomToolsService, agent_runtime_cache_service_1.AgentRuntimeCacheService, agent_validation_service_1.AgentValidationService, credentials_service_1.CredentialsService, telemetry_2.Telemetry, backend_services_1.EventService, agent_setup_completion_service_1.AgentSetupCompletionService, agent_update_broadcaster_1.AgentUpdateBroadcaster, db_1.TransactionRunner, agent_save_completion_service_1.AgentSaveCompletionService, agent_definition_service_1.AgentDefinitionService, agent_policy_service_1.AgentPolicyService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentPublishService);
//# sourceMappingURL=agent-publish.service.js.map