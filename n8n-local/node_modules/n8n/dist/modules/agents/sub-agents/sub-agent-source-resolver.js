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
exports.SubAgentSourceResolver = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const agent_skill_refs_service_1 = require("../agent-skill-refs.service");
const agent_document_1 = require("../json-config/agent-document");
const get_agent_or_throw_1 = require("../utils/get-agent-or-throw");
const agent_history_repository_1 = require("../repositories/agent-history.repository");
const agent_repository_1 = require("../repositories/agent.repository");
const agent_runtime_assets_1 = require("../utils/agent-runtime-assets");
let SubAgentSourceResolver = class SubAgentSourceResolver {
    constructor(agentRepository, agentHistoryRepository, agentSkillRefs) {
        this.agentRepository = agentRepository;
        this.agentHistoryRepository = agentHistoryRepository;
        this.agentSkillRefs = agentSkillRefs;
    }
    async resolveForRuntime(source, context) {
        const agent = await (0, get_agent_or_throw_1.getAgentOrThrow)(this.agentRepository, source.agentId, context.projectId);
        if (context.runtimeSnapshot !== undefined) {
            const saved = (0, n8n_workflow_1.jsonParse)(context.runtimeSnapshot, {
                fallbackValue: null,
            });
            if (!(0, is_record_1.isRecord)(saved) ||
                !(0, is_record_1.isRecord)(saved.source) ||
                typeof saved.source.sourceId !== 'string') {
                throw new n8n_workflow_1.UnexpectedError('Invalid saved background task configuration');
            }
            if (saved.source.sourceId !== source.agentId) {
                throw new n8n_workflow_1.UserError('Saved background task configuration does not match this agent');
            }
            const result = api_types_1.RunnableAgentJsonConfigSchema.safeParse(saved.source.config);
            if (!result.success) {
                throw new n8n_workflow_1.UnexpectedError('Invalid saved background task configuration', {
                    cause: result.error,
                });
            }
            return {
                ...saved,
                source: { ...saved.source, config: result.data },
            };
        }
        if (source.versionId) {
            const version = await this.agentHistoryRepository.findByVersionAndAgentId(source.versionId, source.agentId);
            if (!version) {
                throw new errors_1.NotFoundError(`Version "${source.versionId}" not found for agent "${source.agentId}"`);
            }
            if (!version.schema) {
                throw new n8n_workflow_1.UserError(`Agent "${source.agentId}" version "${source.versionId}" has no config`);
            }
            const { skillRefs, skills } = await this.agentSkillRefs.readVersion(version, {});
            return {
                source: {
                    sourceId: source.agentId,
                    versionId: source.versionId,
                    config: this.toRunnableConfig((0, agent_document_1.toAgentDocument)(version.schema, skillRefs)),
                },
                ...(0, agent_runtime_assets_1.getAgentRuntimeAssets)(version, skills),
            };
        }
        if (context.usePublishedVersion) {
            const activeVersion = agent.activeVersion;
            if (!activeVersion?.schema) {
                throw new n8n_workflow_1.UserError(`Sub-agent "${agent.name}" is not published. Publish it before delegating to it in a production run.`);
            }
            const { skillRefs, skills } = await this.agentSkillRefs.readVersion(activeVersion, {});
            return {
                source: {
                    sourceId: source.agentId,
                    versionId: activeVersion.versionId,
                    config: this.toRunnableConfig((0, agent_document_1.toAgentDocument)(activeVersion.schema, skillRefs)),
                },
                ...(0, agent_runtime_assets_1.getAgentRuntimeAssets)(activeVersion, skills),
            };
        }
        if (!agent.schema) {
            throw new n8n_workflow_1.UserError(`Sub-agent "${source.agentId}" has no config`);
        }
        const { skillRefs, skills } = await this.agentSkillRefs.readDraft(agent, {});
        return {
            source: {
                sourceId: source.agentId,
                config: this.toRunnableConfig((0, agent_document_1.toAgentDocument)(agent.schema, skillRefs)),
            },
            ...(0, agent_runtime_assets_1.getAgentRuntimeAssets)(agent, skills),
        };
    }
    toRunnableConfig(config) {
        const result = api_types_1.RunnableAgentJsonConfigSchema.safeParse(config);
        if (!result.success) {
            throw new n8n_workflow_1.UserError(`Invalid sub-agent config: ${result.error.issues[0]?.message ?? 'Invalid config'}`);
        }
        return result.data;
    }
};
exports.SubAgentSourceResolver = SubAgentSourceResolver;
exports.SubAgentSourceResolver = SubAgentSourceResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository, agent_history_repository_1.AgentHistoryRepository, agent_skill_refs_service_1.AgentSkillRefsService])
], SubAgentSourceResolver);
//# sourceMappingURL=sub-agent-source-resolver.js.map