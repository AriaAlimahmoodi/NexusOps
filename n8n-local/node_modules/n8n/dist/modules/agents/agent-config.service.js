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
exports.AgentConfigService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const agent_modification_telemetry_service_1 = require("./agent-modification-telemetry.service");
const agent_config_preparation_service_1 = require("./agent-config-preparation.service");
const agent_policy_service_1 = require("./agent-policy.service");
const agent_save_completion_service_1 = require("./agent-save-completion.service");
const agent_setup_completion_service_1 = require("./agent-setup-completion.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const integrations_sync_1 = require("./integrations/integrations-sync");
const agent_config_composition_1 = require("./json-config/agent-config-composition");
const agent_document_1 = require("./json-config/agent-document");
const prune_missing_config_references_1 = require("./json-config/prune-missing-config-references");
const agent_task_repository_1 = require("./repositories/agent-task.repository");
const agent_repository_1 = require("./repositories/agent.repository");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const agent_config_hash_1 = require("./utils/agent-config-hash");
const agent_draft_utils_1 = require("./utils/agent-draft.utils");
const sub_agent_resolver_1 = require("./utils/sub-agent-resolver");
let AgentConfigService = class AgentConfigService {
    constructor(logger, agentRepository, agentTaskRepository, configPreparation, setupCompletionService, transactionRunner, saveCompletion, agentPolicyService, agentSkillRefs) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.agentTaskRepository = agentTaskRepository;
        this.configPreparation = configPreparation;
        this.setupCompletionService = setupCompletionService;
        this.transactionRunner = transactionRunner;
        this.saveCompletion = saveCompletion;
        this.agentPolicyService = agentPolicyService;
        this.agentSkillRefs = agentSkillRefs;
    }
    async getConfig(agentId, projectId) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        const config = (0, agent_config_composition_1.composeJsonConfig)(entity, await this.agentSkillRefs.refsForDraft(entity, {}));
        if (!config) {
            throw new n8n_workflow_1.UserError('Agent has no JSON config yet.');
        }
        return config;
    }
    async validateConfig(raw) {
        return await this.configPreparation.validateConfig(raw);
    }
    async updateConfig(agentId, projectId, config, user, options) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        const previousSkillRefs = await this.agentSkillRefs.refsForDraft(entity, {});
        if (options.baseConfigHash !== (0, agent_config_hash_1.getAgentConfigHash)((0, agent_config_composition_1.composeJsonConfig)(entity, previousSkillRefs))) {
            throw new errors_1.ConflictError('Agent config was changed elsewhere; reload to get the latest version');
        }
        const clearOmitted = options.clearOmittedOptionalFields === true;
        const { validatedConfig, credentialProvider } = await this.configPreparation.prepareConfig(config, projectId, user);
        const previousSchema = entity.schema ? (0, agent_document_1.toAgentDocument)(entity.schema, previousSkillRefs) : null;
        const existingTaskIds = await this.reconcileConfigReferences(entity, previousSchema, validatedConfig, clearOmitted);
        const replacement = this.buildConfigReplacement(entity, previousSchema, validatedConfig, config, clearOmitted);
        if (replacement.nextSchema.skills !== undefined) {
            replacement.nextSchema.skills = await this.agentSkillRefs.effectiveDraftRefs(entity, replacement.nextSchema.skills, {});
        }
        await this.agentPolicyService.enforceSave(projectId, agentId, replacement.nextSchema, replacement.previousSchema, { kind: 'user', user });
        const next = (0, agent_document_1.fromAgentDocument)(replacement.nextSchema);
        entity.schema = next.config;
        entity.name = validatedConfig.name;
        entity.integrations = replacement.nextIntegrations;
        (0, agent_draft_utils_1.markAgentDraftDirty)(entity);
        this.removeUnreferencedResources(entity, validatedConfig, clearOmitted);
        const saved = await this.saveConfig(entity, next.skillRefs, credentialProvider, user, options, replacement, existingTaskIds);
        return await this.finishConfigUpdate(saved, validatedConfig, replacement, clearOmitted);
    }
    async finishConfigUpdate(saved, validatedConfig, replacement, clearOmitted) {
        if (writesField(validatedConfig, 'integrations', clearOmitted)) {
            await (0, integrations_sync_1.syncAgentIntegrations)(saved, replacement.previousIntegrations, replacement.nextIntegrations, this.logger);
        }
        const savedConfig = (0, agent_config_composition_1.composeJsonConfig)(saved, await this.agentSkillRefs.refsForDraft(saved, {})) ??
            validatedConfig;
        return {
            config: savedConfig,
            configHash: (0, agent_config_hash_1.getAgentConfigHash)(savedConfig),
            updatedAt: saved.updatedAt.toISOString(),
            versionId: saved.versionId,
        };
    }
    async removeUnreferencedTasks(agent, existingTaskIds, ctx) {
        const referencedTaskIds = new Set((agent.schema?.tasks ?? []).map((ref) => ref.id));
        const orphanTaskIds = existingTaskIds.filter((id) => !referencedTaskIds.has(id));
        if (orphanTaskIds.length > 0) {
            await this.agentTaskRepository.deleteForAgent(agent.id, orphanTaskIds, ctx);
        }
    }
    async saveConfig(entity, skillRefs, credentialProvider, user, options, replacement, existingTaskIds) {
        const { id: agentId, projectId } = entity;
        const { changedParts, previousSchema, previousIntegrations } = replacement;
        const emitSetupCompleted = await this.setupCompletionService.recordIfSetupComplete(entity, skillRefs, projectId, credentialProvider, user);
        const saved = await this.transactionRunner.run({}, async (ctx) => {
            await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, entity, ctx);
            await this.agentSkillRefs.replaceDraftRefs(entity, skillRefs, ctx);
            await this.removeUnreferencedTasks(entity, existingTaskIds, ctx);
            return entity;
        });
        await this.saveCompletion.configurationSaved({
            agent: saved,
            config: replacement.nextSchema,
            projectId,
            user,
            by: options.modifiedBy,
            changedParts,
            wasUnconfigured: (0, agent_modification_telemetry_service_1.isUnconfiguredAgent)(previousSchema, previousIntegrations),
        }, options.pushRef, emitSetupCompleted);
        this.logger.debug('Updated agent JSON config', { agentId, projectId });
        return saved;
    }
    removeUnreferencedResources(entity, config, clearOmitted) {
        if (writesField(config, 'tools', clearOmitted)) {
            this.removeUnreferencedCustomTools(entity, config);
        }
        if (!this.agentSkillRefs.usesSkillsHub && writesField(config, 'skills', clearOmitted)) {
            const referenced = new Set((config.skills ?? []).map((ref) => ref.id));
            entity.skills = Object.fromEntries(Object.entries(entity.skills ?? {}).filter(([id]) => referenced.has(id)));
        }
    }
    removeUnreferencedCustomTools(entity, config) {
        const referencedIds = new Set((config.tools ?? [])
            .filter((tool) => tool.type === 'custom')
            .map((tool) => tool.id));
        const orphanIds = Object.keys(entity.tools).filter((id) => !referencedIds.has(id));
        if (orphanIds.length === 0)
            return;
        const tools = { ...entity.tools };
        for (const id of orphanIds)
            delete tools[id];
        entity.tools = tools;
    }
    buildConfigReplacement(entity, previousSchema, validatedConfig, rawConfig, clearOmitted) {
        const previousIntegrations = entity.integrations ?? [];
        const { schemaConfig, integrations } = (0, agent_config_composition_1.decomposeJsonConfig)(validatedConfig);
        const nextIntegrations = writesField(validatedConfig, 'integrations', clearOmitted)
            ? integrations
            : previousIntegrations;
        const nextSchema = this.mergeConfigSchema(schemaConfig, previousSchema, rawConfig, clearOmitted);
        const changedParts = (0, agent_modification_telemetry_service_1.diffAgentConfigParts)(previousSchema, nextSchema, previousIntegrations, nextIntegrations);
        return {
            nextSchema,
            nextIntegrations,
            previousSchema,
            previousIntegrations,
            changedParts,
        };
    }
    mergeConfigSchema(decomposedSchema, previousSchema, config, clearOmitted) {
        const nextSchema = {
            ...previousSchema,
            name: decomposedSchema.name,
            model: decomposedSchema.model,
            instructions: decomposedSchema.instructions,
        };
        for (const field of OPTIONAL_SCHEMA_FIELDS) {
            applyOptionalField(nextSchema, decomposedSchema, field, clearOmitted);
        }
        if (decomposedSchema.personalisation !== undefined && !clearOmitted) {
            nextSchema.personalisation = mergePersonalisationWithPreviousGradient(decomposedSchema.personalisation, previousSchema, config);
        }
        for (const field of ['description', 'modelDeploymentName']) {
            if (decomposedSchema[field] === '')
                delete nextSchema[field];
        }
        return nextSchema;
    }
    async reconcileConfigReferences(entity, previousSchema, config, clearOmitted) {
        const existingTaskIds = writesField(config, 'tasks', clearOmitted)
            ? (await this.agentTaskRepository.findByAgentId(entity.id)).map((task) => task.id)
            : [];
        (0, prune_missing_config_references_1.pruneMissingConfigReferences)(config, previousSchema, {
            tools: entity.tools ?? {},
            taskIds: new Set(existingTaskIds),
        });
        const resolvedSubAgents = await this.reconcileSubAgentReferences(config, entity);
        this.validateSubAgentRefs(resolvedSubAgents, entity);
        return existingTaskIds;
    }
    async reconcileSubAgentReferences(config, entity) {
        if (config.subAgents?.agents !== undefined) {
            const existingAgentIds = new Set((entity.schema?.subAgents?.agents ?? []).map((ref) => ref.agentId));
            const resolvedSubAgents = await (0, sub_agent_resolver_1.resolveUniqueSubAgents)({
                refs: config.subAgents.agents,
                projectId: entity.projectId,
                agentRepository: this.agentRepository,
            });
            config.subAgents.agents = resolvedSubAgents
                .filter(({ agentId, agent }) => existingAgentIds.has(agentId) || agent !== null)
                .map(({ agent: _agent, ...ref }) => ref);
            return resolvedSubAgents;
        }
        return [];
    }
    validateSubAgentRefs(resolvedSubAgents, entity) {
        for (const { agentId } of resolvedSubAgents) {
            if (agentId === entity.id) {
                throw new n8n_workflow_1.UserError('Invalid agent config: An agent cannot use itself as a subagent');
            }
        }
    }
};
exports.AgentConfigService = AgentConfigService;
exports.AgentConfigService = AgentConfigService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_task_repository_1.AgentTaskRepository, agent_config_preparation_service_1.AgentConfigPreparationService, agent_setup_completion_service_1.AgentSetupCompletionService, db_1.TransactionRunner, agent_save_completion_service_1.AgentSaveCompletionService, agent_policy_service_1.AgentPolicyService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentConfigService);
function mergePersonalisationWithPreviousGradient(personalisation, previousSchema, rawConfig) {
    if (!personalisation || !(0, is_record_1.isRecord)(rawConfig) || !(0, is_record_1.isRecord)(rawConfig.personalisation)) {
        return personalisation;
    }
    if (rawConfig.personalisation.gradient !== undefined)
        return personalisation;
    const previousGradient = previousSchema?.personalisation?.gradient;
    if (!previousGradient)
        return personalisation;
    return {
        ...personalisation,
        gradient: previousGradient,
    };
}
const OPTIONAL_SCHEMA_FIELDS = [
    'credential',
    'description',
    'modelDeploymentName',
    'personalisation',
    'memory',
    'subAgents',
    'tools',
    'skills',
    'tasks',
    'providerTools',
    'config',
    'mcpServers',
    'vectorStores',
];
function writesField(config, field, clearOmitted) {
    return config[field] !== undefined || clearOmitted;
}
function applyOptionalField(target, submitted, field, clearOmitted) {
    if (!writesField(submitted, field, clearOmitted))
        return;
    if (submitted[field] === undefined)
        delete target[field];
    else
        target[field] = submitted[field];
}
//# sourceMappingURL=agent-config.service.js.map