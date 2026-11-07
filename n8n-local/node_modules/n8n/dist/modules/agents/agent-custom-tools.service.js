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
exports.AgentCustomToolsService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const agent_modification_telemetry_service_1 = require("./agent-modification-telemetry.service");
const agent_save_completion_service_1 = require("./agent-save-completion.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_repository_1 = require("./repositories/agent.repository");
const get_agent_or_throw_1 = require("./utils/get-agent-or-throw");
const agent_draft_utils_1 = require("./utils/agent-draft.utils");
let AgentCustomToolsService = class AgentCustomToolsService {
    constructor(logger, agentRepository, saveCompletion, agentSkillRefs) {
        this.logger = logger;
        this.agentRepository = agentRepository;
        this.saveCompletion = saveCompletion;
        this.agentSkillRefs = agentSkillRefs;
    }
    async buildCustomTool(agentId, projectId, code, descriptor, context, options = {}) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        if (!api_types_1.CUSTOM_TOOL_ID_REGEX.test(descriptor.name)) {
            throw new n8n_workflow_1.UserError(`Custom tool name "${descriptor.name}" contains invalid characters. Only letters, numbers, and underscores are allowed.`);
        }
        const toolId = descriptor.name;
        const nextEntry = { code, descriptor };
        if ((0, isEqual_1.default)(entity.tools?.[toolId], nextEntry)) {
            return { ok: true, id: toolId, descriptor, changed: false };
        }
        const skillRefs = await this.agentSkillRefs.refsForDraft(entity, {});
        const previous = (0, agent_modification_telemetry_service_1.captureAgentMutation)(entity, skillRefs);
        entity.tools = {
            ...entity.tools,
            [toolId]: nextEntry,
        };
        await this.saveToolChanges(entity, skillRefs, projectId, context, previous, options.recordTelemetry);
        this.logger.debug('Built custom tool', { agentId, projectId, toolId });
        return { ok: true, id: toolId, descriptor, changed: true };
    }
    async deleteCustomTool(agentId, projectId, toolId, context) {
        const entity = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, agentId, projectId, 'Agent not found');
        if (!entity.tools?.[toolId])
            return;
        const skillRefs = await this.agentSkillRefs.refsForDraft(entity, {});
        const previous = (0, agent_modification_telemetry_service_1.captureAgentMutation)(entity, skillRefs);
        const tools = { ...entity.tools };
        delete tools[toolId];
        entity.tools = tools;
        if (entity.schema?.tools) {
            entity.schema.tools = entity.schema.tools.filter((t) => !(t.type === 'custom' && 'id' in t && t.id === toolId));
        }
        await this.saveToolChanges(entity, skillRefs, projectId, context, previous);
        this.logger.debug('Deleted custom tool', { agentId, projectId, toolId });
    }
    getMissingCustomToolIds(config, tools) {
        const refs = (config?.tools ?? []).filter((ref) => ref.type === 'custom');
        const seen = new Set();
        const missing = [];
        for (const ref of refs) {
            if (ref.enabled === false)
                continue;
            if (seen.has(ref.id))
                continue;
            seen.add(ref.id);
            if (!tools[ref.id])
                missing.push(ref.id);
        }
        return missing;
    }
    snapshotConfiguredTools(config, tools) {
        if (!config)
            return null;
        const missing = this.getMissingCustomToolIds(config, tools);
        if (missing.length > 0) {
            throw new n8n_workflow_1.UserError(`Cannot publish agent with missing custom tools: ${missing.join(', ')}`);
        }
        const snapshot = {};
        for (const ref of config.tools ?? []) {
            if (ref.type !== 'custom')
                continue;
            const tool = tools[ref.id];
            if (tool)
                snapshot[ref.id] = tool;
        }
        return snapshot;
    }
    async saveToolChanges(entity, skillRefs, projectId, context, previous, recordTelemetry = true) {
        (0, agent_draft_utils_1.markAgentDraftDirty)(entity);
        const saved = await (0, agent_draft_utils_1.saveAgentDraftFenced)(this.agentRepository, entity);
        await this.saveCompletion.bodySaved((0, agent_modification_telemetry_service_1.buildAgentMutationEvent)(saved, skillRefs, projectId, context, previous, { tools: true }), context.pushRef, recordTelemetry);
    }
};
exports.AgentCustomToolsService = AgentCustomToolsService;
exports.AgentCustomToolsService = AgentCustomToolsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_repository_1.AgentRepository, agent_save_completion_service_1.AgentSaveCompletionService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentCustomToolsService);
//# sourceMappingURL=agent-custom-tools.service.js.map