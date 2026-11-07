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
exports.AgentValidationService = void 0;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const node_catalog_1 = require("@n8n/ai-utilities/node-catalog");
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const agent_missing_skill_ids_1 = require("../../modules/agents/utils/agent-missing-skill-ids");
const node_types_1 = require("../../node-types");
const ai_gateway_eligibility_1 = require("../../services/ai-gateway-eligibility");
const ai_gateway_service_1 = require("../../services/ai-gateway.service");
const agent_definition_service_1 = require("./agent-definition.service");
const agent_skill_refs_service_1 = require("./agent-skill-refs.service");
const agent_definition_1 = require("./utils/agent-definition");
const agent_chat_integration_1 = require("./integrations/agent-chat-integration");
const cron_validation_1 = require("./integrations/cron-validation");
const agent_repository_1 = require("./repositories/agent.repository");
const workflow_tool_workflow_resolver_1 = require("./tools/workflow-tool-workflow-resolver");
const extract_agent_workflow_refs_1 = require("./utils/extract-agent-workflow-refs");
const node_tool_validation_1 = require("./utils/node-tool-validation");
const skill_names_1 = require("./skills/skill-names");
function issue(code, path, capability, reason) {
    return reason === undefined ? { code, path, capability } : { code, path, capability, reason };
}
function agentIssue(code, path) {
    return issue(code, path, { kind: 'agent' });
}
let AgentValidationService = class AgentValidationService {
    constructor(agentRepository, definitionService, nodeTypes, workflowRepository, chatIntegrationRegistry, aiGatewayService, agentSkillRefs) {
        this.agentRepository = agentRepository;
        this.definitionService = definitionService;
        this.nodeTypes = nodeTypes;
        this.workflowRepository = workflowRepository;
        this.chatIntegrationRegistry = chatIntegrationRegistry;
        this.aiGatewayService = aiGatewayService;
        this.agentSkillRefs = agentSkillRefs;
    }
    isAiGatewayModelSupported(model) {
        const provider = (0, agent_config_1.getProviderPrefix)(model);
        if (!provider)
            return false;
        const credentialType = this.aiGatewayService.getCredentialTypeForProviderCached(provider);
        if (credentialType === undefined)
            return undefined;
        return credentialType !== null;
    }
    async validateAgentIsRunnable(agentId, projectId, credentialProvider) {
        const { issues } = await this.validateAgentConfiguration(agentId, projectId, credentialProvider, 'runtime');
        return { missing: issues.map((i) => i.path) };
    }
    async validateAgentConfiguration(agentId, projectId, credentialProvider, scope = 'publish') {
        const agentEntity = await this.agentRepository.findByIdAndProjectId(agentId, projectId);
        if (!agentEntity) {
            return { status: 'invalid', issues: [agentIssue('missing_required', 'agent')] };
        }
        return await this.validateLoadedAgentConfiguration(agentEntity, projectId, credentialProvider, scope);
    }
    async validateLoadedAgentConfiguration(agent, projectId, credentialProvider, scope = 'publish', pending) {
        if (scope === 'runtime') {
            return await this.validateAgentEntityConfiguration(agent, pending ? pending.skillRefs : await this.agentSkillRefs.refsForDraft(agent, {}), projectId, new Map(), credentialProvider, scope);
        }
        const definition = await this.definitionService.readDraft(agent, {}, pending);
        return await this.validateDefinition(agent.id, projectId, definition, agent.integrations ?? [], credentialProvider, scope);
    }
    async validateAgentEntityConfiguration(agent, skillRefs, projectId, tasks, credentialProvider, scope = 'publish') {
        const skills = await this.agentSkillRefs.skillsForRefs(agent, skillRefs, {});
        return await this.validateDefinition(agent.id, projectId, { ...(0, agent_definition_1.getAgentDefinitionContent)(agent, skillRefs, skills), tasks }, agent.integrations ?? [], credentialProvider, scope);
    }
    async validateAgentHistoryConfiguration(agentId, projectId, history, currentIntegrations, credentialProvider) {
        const definition = await this.definitionService.readVersion(history);
        return await this.validateDefinition(agentId, projectId, definition, currentIntegrations, credentialProvider, 'publish');
    }
    async validateDefinition(agentId, projectId, definition, integrations, credentialProvider, scope) {
        return await this.runValidation({
            agentId,
            projectId,
            config: definition.schema,
            skills: definition.skills,
            customTools: definition.tools,
            tasks: definition.tasks,
            integrations,
            credentialProvider,
        }, scope);
    }
    async runValidation(ctx, scope = 'publish') {
        if (!ctx.config) {
            return { status: 'invalid', issues: this.missingConfigIssues() };
        }
        const issues = await this.collectIssues({ ...ctx, config: ctx.config }, scope);
        const warnings = this.collectSkillNameWarnings(ctx.config, ctx.skills);
        return {
            status: issues.length === 0 ? 'valid' : 'invalid',
            issues,
            ...(warnings.length > 0 ? { warnings } : {}),
        };
    }
    collectSkillNameWarnings(config, skills) {
        const names = (config.skills ?? []).flatMap((ref) => Object.hasOwn(skills, ref.id) ? [skills[ref.id].name] : []);
        return (0, skill_names_1.findNameClashGroups)(names).map((group) => ({
            code: 'similar_skill_names',
            capability: { kind: 'skill' },
            names: group,
        }));
    }
    missingConfigIssues() {
        return [
            agentIssue('missing_required', 'instructions'),
            agentIssue('missing_required', 'model'),
            agentIssue('missing_credential', 'credential'),
        ];
    }
    async collectIssues(ctx, scope) {
        const { config } = ctx;
        const issues = [];
        let credentialList;
        const findCredential = async (credentialId) => {
            credentialList ??= await ctx.credentialProvider.list();
            return credentialList.find((credential) => credential.id === credentialId);
        };
        const { agentsById, workflowsByReference } = await this.prefetchReferenceLookups(ctx);
        this.collectCoreIssues(config, issues);
        this.collectVectorStoreIssues(config, issues);
        await this.collectMainCredentialIssues(config, findCredential, ctx.credentialProvider, issues);
        await this.collectVertexModelIssues(config, findCredential, issues);
        this.collectSubAgentRefIssues(ctx, agentsById, issues);
        this.collectSkillIssues(config, ctx.skills, issues);
        if (scope === 'publish') {
            for (const violation of (0, node_tool_validation_1.findHttpRequestToolUrlFromAiViolations)(config.tools)) {
                if (config.tools?.[violation.toolIndex].enabled === false)
                    continue;
                issues.push(issue('invalid_value', violation.path, {
                    kind: 'tool',
                    id: violation.toolName,
                    index: violation.toolIndex,
                    toolType: 'node',
                }));
            }
            this.collectTaskIssues(config, ctx.tasks, issues);
            await this.collectChannelIssues(ctx.integrations, findCredential, issues);
        }
        await this.collectToolIssues(ctx, findCredential, workflowsByReference, issues, scope);
        await this.collectMcpServerIssues(config, findCredential, issues);
        return this.dedupe(issues);
    }
    async prefetchReferenceLookups(ctx) {
        const subAgentIds = new Set();
        const workflowRefs = (0, extract_agent_workflow_refs_1.extractAgentWorkflowRefs)(ctx.config).filter((ref) => ref.enabled !== false && ref.workflow);
        for (const ref of ctx.config.subAgents?.agents ?? []) {
            if (ref.enabled === false)
                continue;
            if (ref.agentId && ref.agentId !== ctx.agentId) {
                subAgentIds.add(ref.agentId);
            }
        }
        const [agents, workflowsByReference] = await Promise.all([
            this.agentRepository.findByIdsAndProjectId([...subAgentIds], ctx.projectId),
            (0, workflow_tool_workflow_resolver_1.findWorkflowToolWorkflows)(this.workflowRepository, workflowRefs, ctx.projectId),
        ]);
        return {
            agentsById: new Map(agents.map((agent) => [agent.id, agent])),
            workflowsByReference,
        };
    }
    dedupe(issues) {
        const seen = new Set();
        const result = [];
        for (const item of issues) {
            const key = `${item.code}:${item.path}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            result.push(item);
        }
        return result;
    }
    collectCoreIssues(config, issues) {
        if (!config.instructions?.trim()) {
            issues.push(agentIssue('missing_required', 'instructions'));
        }
        if ((0, api_types_1.isDraftAgentConfig)(config)) {
            issues.push(agentIssue('missing_required', 'model'));
        }
        else if (!api_types_1.AgentModelSchema.safeParse(config.model).success) {
            issues.push(agentIssue('invalid_value', 'model'));
        }
    }
    async collectMainCredentialIssues(config, findCredential, credentialProvider, issues) {
        if (!config.credential?.trim()) {
            issues.push(agentIssue('missing_credential', 'credential'));
            return;
        }
        const credentialId = config.credential.trim();
        if (credentialId === api_types_1.AI_GATEWAY_MANAGED_TAG) {
            const model = config.model?.trim();
            if (model && this.isAiGatewayModelSupported(model) === false) {
                issues.push(agentIssue('incompatible_credential', 'credential'));
            }
            return;
        }
        const credential = await this.findCredentialSafe(findCredential, credentialId);
        if (!credential) {
            issues.push(agentIssue('invalid_credential', 'credential'));
            return;
        }
        const model = config.model?.trim();
        if (model &&
            api_types_1.AgentModelSchema.safeParse(model).success &&
            !this.credentialSupportsModel(credential.type, model)) {
            issues.push(agentIssue('incompatible_credential', 'credential'));
        }
        await this.collectAzureDeploymentIssues(config, credentialId, credentialProvider, issues);
    }
    async collectVertexModelIssues(config, findCredential, issues) {
        const slots = [
            ...Object.entries(config.subAgents?.modelsByDifficulty ?? {}).map(([difficulty, model]) => [
                `subAgents.modelsByDifficulty.${difficulty}.`,
                model,
            ]),
        ];
        if (config.memory?.enabled) {
            const observational = config.memory.observationalMemory;
            if (observational?.enabled !== false) {
                slots.push(['memory.observationalMemory.observerModel.', observational?.observerModel], ['memory.observationalMemory.reflectorModel.', observational?.reflectorModel]);
            }
            const episodic = config.memory.episodicMemory;
            if (episodic?.enabled) {
                slots.push(['memory.episodicMemory.reflectorModel.', episodic.reflectorModel]);
            }
        }
        for (const [path, model] of slots) {
            if (!model || (0, agent_config_1.getProviderPrefix)(model.model) !== 'google-vertex')
                continue;
            if (!model.credential?.trim()) {
                issues.push(agentIssue('missing_credential', `${path}credential`));
                continue;
            }
            const credential = await this.findCredentialSafe(findCredential, model.credential.trim());
            if (!credential) {
                issues.push(agentIssue('invalid_credential', `${path}credential`));
            }
            else if (!this.credentialSupportsModel(credential.type, model.model)) {
                issues.push(agentIssue('incompatible_credential', `${path}credential`));
            }
        }
    }
    collectSubAgentRefIssues(ctx, agentsById, issues) {
        const refs = ctx.config.subAgents?.agents ?? [];
        for (let index = 0; index < refs.length; index++) {
            const ref = refs[index];
            if (ref.enabled === false)
                continue;
            const path = `subAgents.agents.${index}.agentId`;
            const capability = {
                kind: 'subAgent',
                id: ref.agentId,
                index,
            };
            if (ref.agentId === ctx.agentId) {
                issues.push(issue('incompatible_reference', path, capability));
                continue;
            }
            const target = agentsById.get(ref.agentId);
            if (!target) {
                issues.push(issue('missing_reference', path, capability));
            }
        }
    }
    collectSkillIssues(config, skills, issues) {
        for (const skillId of (0, agent_missing_skill_ids_1.getMissingSkillIds)(config.skills, skills)) {
            issues.push(issue('missing_reference', `skill:${skillId}`, { kind: 'skill', id: skillId }));
        }
    }
    collectTaskIssues(config, tasks, issues) {
        const refs = config.tasks ?? [];
        for (let index = 0; index < refs.length; index++) {
            const ref = refs[index];
            const task = tasks.get(ref.id);
            if (!task) {
                issues.push(issue('missing_reference', `tasks.${index}.id`, { kind: 'task', id: ref.id, index }));
                continue;
            }
            if (!ref.enabled)
                continue;
            if (!api_types_1.agentTaskSchema.safeParse(task).success || !(0, cron_validation_1.isValidCronExpression)(task.cronExpression)) {
                issues.push(issue('invalid_value', `tasks.${index}`, { kind: 'task', id: ref.id, index }));
            }
        }
    }
    collectVectorStoreIssues(config, issues) {
        const collisions = new Set((0, api_types_1.findVectorStoreToolNameCollisions)(config));
        const stores = config.vectorStores ?? [];
        for (let index = 0; index < stores.length; index++) {
            const store = stores[index];
            if (!collisions.has(`search_${store.name.replace(/-/g, '_')}`))
                continue;
            issues.push(issue('invalid_value', `vectorStores.${index}.name`, {
                kind: 'vectorStore',
                id: store.name,
                index,
            }));
        }
    }
    async collectChannelIssues(integrations, findCredential, issues) {
        for (let index = 0; index < integrations.length; index++) {
            const integration = integrations[index];
            if (integration.type === 'n8n_chat')
                continue;
            const path = `integrations.${index}.credentialId`;
            const capability = {
                kind: 'channel',
                id: integration.type,
                index,
            };
            if ((0, api_types_1.isDraftIntegration)(integration)) {
                issues.push(issue('missing_credential', path, capability));
                continue;
            }
            const credentialId = integration.credentialId.trim();
            const credential = await this.findCredentialSafe(findCredential, credentialId);
            if (!credential) {
                issues.push(issue('invalid_credential', path, capability));
                continue;
            }
            const integrationImpl = this.chatIntegrationRegistry.get(integration.type);
            if (integrationImpl && !integrationImpl.credentialTypes.includes(credential.type)) {
                issues.push(issue('incompatible_credential', path, capability));
            }
        }
    }
    async collectToolIssues(ctx, findCredential, workflowsByReference, issues, scope) {
        const tools = ctx.config.tools ?? [];
        for (let index = 0; index < tools.length; index++) {
            const tool = tools[index];
            if (tool.enabled === false)
                continue;
            if (tool.type === 'custom') {
                this.collectCustomToolIssues(tool.id, index, ctx.customTools, issues);
                continue;
            }
            if (tool.type === 'workflow') {
                this.collectWorkflowToolIssues(tool, index, workflowsByReference, issues, scope);
                continue;
            }
            if (tool.type === 'node') {
                await this.collectNodeToolIssues(tool, index, findCredential, issues);
            }
        }
    }
    collectWorkflowToolIssues(tool, index, workflowsByReference, issues, scope) {
        const path = `tools.${index}.${tool.workflowId === undefined ? 'workflow' : 'workflowId'}`;
        const capability = {
            kind: 'tool',
            id: tool.workflow,
            index,
            toolType: 'workflow',
        };
        const workflow = workflowsByReference.get(tool.workflowId ?? tool.workflow);
        if (!workflow) {
            issues.push(issue('missing_reference', path, capability));
            return;
        }
        const incompatibility = (0, api_types_1.getWorkflowToolIncompatibilityReason)(workflow);
        if (incompatibility) {
            issues.push(issue('incompatible_reference', path, capability, incompatibility.reason));
            return;
        }
        if (scope === 'publish' && !workflow.activeVersionId) {
            issues.push(issue('incompatible_reference', path, capability, 'not_published'));
        }
    }
    async collectNodeToolIssues(tool, index, findCredential, issues) {
        const capabilityBase = {
            kind: 'tool',
            id: tool.name,
            index,
            toolType: 'node',
        };
        let nodeType;
        try {
            nodeType = this.nodeTypes.getByNameAndVersion(tool.node.nodeType, tool.node.nodeTypeVersion);
        }
        catch {
            issues.push(issue('missing_reference', `tools.${index}.node.nodeType`, capabilityBase));
            return;
        }
        const nodeParameters = n8n_workflow_1.NodeHelpers.getNodeParameters(nodeType.description.properties, (tool.node.nodeParameters ?? {}), true, false, { typeVersion: tool.node.nodeTypeVersion }, nodeType.description) ?? {};
        const visibleSlots = this.getVisibleCredentialSlots(tool, nodeType.description, nodeParameters);
        for (const slot of visibleSlots) {
            await this.collectNodeCredentialIssues(tool, index, slot.credentialType, nodeParameters, findCredential, issues);
        }
    }
    async gatewayCoversNodeToolSlot(node, credentialType, resolvedParameters) {
        const availability = await this.aiGatewayService.isAvailable();
        if (!availability.available) {
            return this.aiGatewayService.isEnabled() ? undefined : false;
        }
        return (0, ai_gateway_eligibility_1.checkAiGatewayEligibility)({
            type: node.nodeType,
            typeVersion: node.nodeTypeVersion,
            parameters: (node.nodeParameters ?? {}),
        }, credentialType, availability.config, resolvedParameters).eligible;
    }
    async collectMcpServerIssues(config, findCredential, issues) {
        const servers = config.mcpServers ?? [];
        for (let index = 0; index < servers.length; index++) {
            const server = servers[index];
            const capability = {
                kind: 'mcpServer',
                id: server.name,
                index,
            };
            if (!server.url?.trim()) {
                issues.push(issue('missing_required', `mcpServers.${index}.url`, capability));
                continue;
            }
            if (server.authentication === 'none')
                continue;
            const credentialId = server.credential?.trim();
            if (!credentialId) {
                issues.push(issue('missing_credential', `mcpServers.${index}.credential`, capability));
                continue;
            }
            const credential = await this.findCredentialSafe(findCredential, credentialId);
            if (!credential) {
                issues.push(issue('invalid_credential', `mcpServers.${index}.credential`, capability));
            }
            else if (!this.mcpCredentialTypeMatches(server.authentication, credential.type)) {
                issues.push(issue('incompatible_credential', `mcpServers.${index}.credential`, capability));
            }
        }
    }
    mcpCredentialTypeMatches(authentication, credentialType) {
        switch (authentication) {
            case 'bearerAuth':
                return credentialType === 'httpBearerAuth';
            case 'headerAuth':
                return credentialType === 'httpHeaderAuth';
            case 'multipleHeadersAuth':
                return credentialType === 'httpMultipleHeadersAuth';
            case 'mcpOAuth2Api':
                return credentialType === 'mcpOAuth2Api';
            default:
                return (0, n8n_workflow_1.isMcpOAuth2Authentication)(authentication) ? credentialType === authentication : true;
        }
    }
    credentialSupportsModel(credentialType, model) {
        const provider = (0, agent_config_1.getProviderPrefix)(model);
        if (!provider)
            return false;
        return (0, api_types_1.getAgentModelProviderCredentialTypes)(provider).includes(credentialType);
    }
    async findCredentialSafe(findCredential, credentialId) {
        try {
            return await findCredential(credentialId);
        }
        catch {
            return undefined;
        }
    }
    async collectAzureDeploymentIssues(config, credentialId, credentialProvider, issues) {
        const model = config.model?.trim();
        const provider = model ? (0, agent_config_1.getProviderPrefix)(model) : undefined;
        if (provider !== 'azure-openai' || config.modelDeploymentName?.trim())
            return;
        let endpointType;
        try {
            const data = await credentialProvider.resolve(credentialId);
            endpointType = data?.endpointType;
        }
        catch {
            return;
        }
        if (endpointType !== 'foundry') {
            issues.push(agentIssue('missing_required', 'modelDeploymentName'));
        }
    }
    collectCustomToolIssues(id, index, customTools, issues) {
        if (customTools[id])
            return;
        issues.push(issue('missing_reference', `tools.${index}.id`, {
            kind: 'tool',
            id,
            index,
            toolType: 'custom',
        }));
    }
    async collectNodeCredentialIssues(tool, index, credentialType, nodeParameters, findCredential, issues) {
        const capabilityBase = {
            kind: 'tool',
            id: tool.name,
            index,
            toolType: 'node',
        };
        const path = `tools.${index}.node.credentials.${credentialType}`;
        const credentialRef = tool.node.credentials?.[credentialType];
        if (credentialRef && '__aiGatewayManaged' in credentialRef) {
            if ((await this.gatewayCoversNodeToolSlot(tool.node, credentialType, nodeParameters)) === false) {
                issues.push(issue('invalid_credential', path, capabilityBase));
            }
            return;
        }
        const credentialId = credentialRef?.id?.trim();
        if (!credentialId) {
            issues.push(issue('missing_credential', path, capabilityBase));
            return;
        }
        const credential = await this.findCredentialSafe(findCredential, credentialId);
        if (!credential || credential.type !== credentialType) {
            issues.push(issue('invalid_credential', path, capabilityBase));
        }
    }
    getVisibleCredentialSlots(tool, description, nodeParameters) {
        return (0, node_catalog_1.getRequiredNodeCredentialSlots)(description).filter((slot) => {
            const definition = description.credentials?.find((credential) => credential.name === slot.credentialType);
            return (!definition ||
                n8n_workflow_1.NodeHelpers.displayParameter(nodeParameters, definition, { typeVersion: tool.node.nodeTypeVersion }, description));
        });
    }
};
exports.AgentValidationService = AgentValidationService;
exports.AgentValidationService = AgentValidationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_repository_1.AgentRepository, agent_definition_service_1.AgentDefinitionService, node_types_1.NodeTypes, db_1.WorkflowRepository, agent_chat_integration_1.ChatIntegrationRegistry, ai_gateway_service_1.AiGatewayService, agent_skill_refs_service_1.AgentSkillRefsService])
], AgentValidationService);
//# sourceMappingURL=agent-validation.service.js.map