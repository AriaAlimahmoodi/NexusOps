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
exports.InstanceAiAgentContextAdapterService = void 0;
const json_schema_1 = require("@n8n/ai-utilities/json-schema");
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const mcp_registry_service_1 = require("../../modules/mcp-registry/registry/mcp-registry.service");
const check_access_1 = require("../../permissions.ee/check-access");
const errors_1 = require("@n8n/errors");
const agent_execution_service_1 = require("./agent-execution.service");
const agent_context_readers_1 = require("./agent-context-readers");
const agent_integration_persistence_service_1 = require("./agent-integration-persistence.service");
const agent_skills_service_1 = require("./agent-skills.service");
const agent_task_service_1 = require("./agent-task.service");
const agents_settings_service_1 = require("./agents-settings.service");
const agents_tools_service_1 = require("./agents-tools.service");
const agents_service_1 = require("./agents.service");
const attachable_workflows_service_1 = require("./attachable-workflows.service");
const agent_capabilities_1 = require("./agent-capabilities");
const format_preview_context_1 = require("./builder/format-preview-context");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_config_composition_1 = require("./json-config/agent-config-composition");
const schema_text_serializer_1 = require("./json-config/schema-text-serializer");
const agent_config_hash_1 = require("./utils/agent-config-hash");
const toSessionSummary = (thread) => ({
    threadId: thread.id,
    agentId: thread.agentId,
    agentName: thread.agentName,
    title: thread.title?.trim() || `Session #${thread.sessionNumber}`,
    sessionNumber: thread.sessionNumber,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    status: thread.status,
    origin: thread.source,
    failureCount: thread.failureSummary?.count ?? 0,
    totalPromptTokens: thread.totalPromptTokens,
    totalCompletionTokens: thread.totalCompletionTokens,
    totalDuration: thread.totalDuration,
});
const toSessionDetailSummary = (detail) => {
    const failureCount = detail.executions.reduce((count, execution) => count + (execution.failureSummary?.count ?? 0), 0);
    const latestStatus = detail.executions.at(-1)?.status;
    const status = (0, agent_execution_service_1.toSessionStatus)(latestStatus);
    return {
        threadId: detail.thread.id,
        agentId: detail.thread.agentId,
        agentName: detail.thread.agentName,
        title: detail.thread.title?.trim() || `Session #${detail.thread.sessionNumber}`,
        sessionNumber: detail.thread.sessionNumber,
        createdAt: detail.thread.createdAt.toISOString(),
        updatedAt: detail.thread.updatedAt.toISOString(),
        status,
        origin: detail.executions.find((execution) => execution.source)?.source ?? null,
        failureCount,
        totalPromptTokens: detail.thread.totalPromptTokens,
        totalCompletionTokens: detail.thread.totalCompletionTokens,
        totalDuration: detail.thread.totalDuration,
    };
};
let InstanceAiAgentContextAdapterService = class InstanceAiAgentContextAdapterService {
    constructor(agentsService, agentSkillsService, agentTaskService, agentExecutionService, agentIntegrationService, attachableWorkflowsService, mcpRegistryService, agentsToolsService, agentSkillRefs, agentsSettingsService) {
        this.agentsService = agentsService;
        this.agentSkillsService = agentSkillsService;
        this.agentTaskService = agentTaskService;
        this.agentExecutionService = agentExecutionService;
        this.agentIntegrationService = agentIntegrationService;
        this.attachableWorkflowsService = attachableWorkflowsService;
        this.mcpRegistryService = mcpRegistryService;
        this.agentsToolsService = agentsToolsService;
        this.agentSkillRefs = agentSkillRefs;
        this.agentsSettingsService = agentsSettingsService;
    }
    createReader(user, projectId) {
        let canReadAgents;
        return {
            lookup: async (input) => {
                await this.agentsSettingsService.assertEnabled().catch((error) => {
                    throw error instanceof errors_1.ForbiddenError ? new n8n_workflow_1.UserError(error.message) : error;
                });
                canReadAgents ??= (0, check_access_1.userHasScopes)(user, ['agent:read'], false, { projectId });
                if (!(await canReadAgents)) {
                    throw new n8n_workflow_1.UserError("You don't have permission to read Agents in this project.");
                }
                try {
                    return await this.lookup(user, projectId, input);
                }
                catch (error) {
                    if (error instanceof errors_1.NotFoundError || error instanceof errors_1.ForbiddenError) {
                        throw new n8n_workflow_1.UserError(error.message);
                    }
                    throw error;
                }
            },
        };
    }
    async lookup(user, projectId, input) {
        if (input.type === 'agents') {
            const agents = await this.agentsService.findByProjectId(projectId);
            return {
                agents: agents.map((agent) => ({
                    agentId: agent.id,
                    name: agent.name,
                    published: agent.activeVersionId !== null,
                    updatedAt: agent.updatedAt.toISOString(),
                })),
            };
        }
        if (input.type === 'config-schema') {
            return {
                configurableProperties: (0, schema_text_serializer_1.jsonSchemaToCompactText)((0, json_schema_1.zodSchemaToJsonSchema)(api_types_1.AgentJsonConfigBaseSchema)),
            };
        }
        if (input.type === 'capabilities') {
            return {
                channels: await this.agentIntegrationService.listBuilderChatIntegrations(user),
                agentCapabilities: [...agent_capabilities_1.AGENT_CAPABILITIES],
                limitations: [...agent_capabilities_1.AGENT_LIMITATIONS],
            };
        }
        if (input.type === 'integrations') {
            if (!input.queries) {
                return { channels: await this.agentIntegrationService.listBuilderChatIntegrations(user) };
            }
            const mcpResults = (await this.mcpRegistryService.search(input.queries)).filter((result) => !result.isTemplated);
            if (mcpResults.length > 0)
                return { kind: 'mcp', results: mcpResults };
            const nodeResults = await this.agentsToolsService.searchAgentToolNodes(input.queries);
            return {
                kind: 'node',
                results: nodeResults.results,
                queriesWithNoResults: nodeResults.queriesWithNoResults,
            };
        }
        if (input.type === 'attachable-workflows') {
            return {
                workflows: await this.attachableWorkflowsService.list(user, projectId, input.searchTerm),
            };
        }
        const agent = await this.agentsService.findById(input.agentId, projectId);
        if (!agent)
            throw new n8n_workflow_1.UserError('Agent not found.');
        const skillRefs = await this.agentSkillRefs.refsForDraft(agent, {});
        const config = (0, agent_config_composition_1.composeJsonConfig)(agent, skillRefs);
        switch (input.type) {
            case 'config':
                return {
                    agent: {
                        id: agent.id,
                        name: agent.name,
                        published: agent.activeVersionId !== null,
                        draftVersionId: agent.versionId,
                        activeVersionId: agent.activeVersionId,
                        updatedAt: agent.updatedAt.toISOString(),
                    },
                    configState: 'current-draft',
                    config,
                    configHash: (0, agent_config_hash_1.getAgentConfigHash)(config),
                };
            case 'skills': {
                const skills = await this.agentSkillRefs.skillsForRefs(agent, skillRefs, {});
                return {
                    skills: Object.entries(skills).map(([id, skill]) => ({
                        id,
                        name: skill.name,
                        description: skill.description,
                        attached: true,
                    })),
                };
            }
            case 'skill': {
                return await (0, agent_context_readers_1.readAgentSkill)(this.agentSkillsService, agent.id, projectId, input.skillId, input.referencePaths);
            }
            case 'tasks': {
                return { tasks: await (0, agent_context_readers_1.listAgentTasks)(this.agentTaskService, agent) };
            }
            case 'custom-tools':
                return {
                    tools: Object.entries(agent.tools ?? {}).map(([id, tool]) => ({
                        id,
                        name: tool.descriptor.name,
                        description: tool.descriptor.description,
                        attached: (config?.tools ?? []).some((ref) => ref.type === 'custom' && ref.id === id),
                    })),
                };
            case 'custom-tool': {
                const tool = agent.tools?.[input.toolId];
                if (!tool)
                    throw new n8n_workflow_1.UserError('Custom tool not found.');
                return { id: input.toolId, ...tool };
            }
            case 'sessions': {
                const result = await this.agentExecutionService.getThreads(projectId, agent.id, user.id, input.limit ?? 20, input.cursor, {
                    ...(input.status ? { status: input.status } : {}),
                    ...(input.origin ? { origin: input.origin } : {}),
                    ...(input.updatedAfter ? { updatedAfter: new Date(input.updatedAfter) } : {}),
                    ...(input.updatedBefore ? { updatedBefore: new Date(input.updatedBefore) } : {}),
                });
                return {
                    sessions: result.threads.map(toSessionSummary),
                    nextCursor: result.nextCursor,
                };
            }
            case 'session': {
                const detail = await this.agentExecutionService.getThreadDetail(input.threadId, projectId, agent.id, user.id);
                if (!detail)
                    return { notFound: true };
                const transcript = (0, format_preview_context_1.formatPreviewSessionContext)(detail.thread, detail.executions, input.executionId);
                if (transcript === null)
                    return { notFound: true };
                return { session: toSessionDetailSummary(detail), transcript };
            }
        }
    }
};
exports.InstanceAiAgentContextAdapterService = InstanceAiAgentContextAdapterService;
exports.InstanceAiAgentContextAdapterService = InstanceAiAgentContextAdapterService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agents_service_1.AgentsService, agent_skills_service_1.AgentSkillsService, agent_task_service_1.AgentTaskService, agent_execution_service_1.AgentExecutionService, agent_integration_persistence_service_1.AgentIntegrationPersistenceService, attachable_workflows_service_1.AttachableWorkflowsService, mcp_registry_service_1.McpRegistryService, agents_tools_service_1.AgentsToolsService, agent_skill_refs_service_1.AgentSkillRefsService, agents_settings_service_1.AgentsSettingsService])
], InstanceAiAgentContextAdapterService);
//# sourceMappingURL=instance-ai-agent-context.adapter.js.map