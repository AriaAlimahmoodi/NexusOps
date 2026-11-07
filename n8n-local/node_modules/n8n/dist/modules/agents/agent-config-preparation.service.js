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
exports.AgentConfigPreparationService = void 0;
const agent_config_1 = require("@n8n/ai-utilities/agent-config");
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const credentials_service_1 = require("../../credentials/credentials.service");
const node_tool_ai_gateway_service_1 = require("./json-config/node-tool-ai-gateway.service");
const sanitize_unknown_agent_credentials_1 = require("./json-config/sanitize-unknown-agent-credentials");
const workflow_tool_workflow_resolver_1 = require("./tools/workflow-tool-workflow-resolver");
const agent_credential_provider_1 = require("./utils/agent-credential-provider");
const node_tool_validation_1 = require("./utils/node-tool-validation");
let AgentConfigPreparationService = class AgentConfigPreparationService {
    constructor(credentialsService, workflowRepository, nodeToolAiGatewayService) {
        this.credentialsService = credentialsService;
        this.workflowRepository = workflowRepository;
        this.nodeToolAiGatewayService = nodeToolAiGatewayService;
    }
    async prepareConfig(config, projectId, user) {
        const credentialProvider = (0, agent_credential_provider_1.createAgentCredentialProvider)(this.credentialsService, projectId, user);
        const accessibleCredentials = await credentialProvider.list();
        const accessibleCredentialIds = new Set(accessibleCredentials.map((credential) => credential.id));
        const sanitizedBaseConfig = (0, api_types_1.sanitizeAgentJsonConfig)(config);
        const sanitizedConfig = (0, sanitize_unknown_agent_credentials_1.sanitizeUnknownAgentCredentials)(sanitizedBaseConfig, accessibleCredentialIds);
        const result = await this.validateConfig(sanitizedConfig);
        if (!result.valid) {
            throw new n8n_workflow_1.UserError(`Invalid agent config: ${result.error}`);
        }
        const validatedConfig = (0, agent_config_1.reconcileNativeWebSearch)(result.config);
        if (validatedConfig.tools !== undefined) {
            await this.nodeToolAiGatewayService.assignManagedCredentials(validatedConfig.tools.filter((tool) => tool.enabled !== false), new Set(accessibleCredentials.map((credential) => credential.type)));
        }
        await (0, workflow_tool_workflow_resolver_1.normalizeWorkflowToolRefs)(this.workflowRepository, validatedConfig, projectId);
        return { validatedConfig, credentialProvider };
    }
    async validateConfig(raw) {
        if (hasNodeToolInputSchema(raw)) {
            return { valid: false, error: 'Node tool configs must not include inputSchema.' };
        }
        const parsed = api_types_1.AgentJsonConfigSchema.safeParse((0, api_types_1.sanitizeAgentJsonConfig)(raw));
        if (!parsed.success) {
            return { valid: false, error: (0, api_types_1.formatAgentConfigZodError)(parsed.error) };
        }
        const config = parsed.data;
        const toolNameCollisions = (0, api_types_1.findVectorStoreToolNameCollisions)(config);
        if (toolNameCollisions.length > 0) {
            return {
                valid: false,
                error: `Vector store tool name collides with an existing tool: ${toolNameCollisions.join(', ')}`,
            };
        }
        try {
            (0, node_tool_validation_1.validateNodeToolExpressions)(config.tools);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                valid: false,
                error: `Invalid $fromAI expression in node tool config: ${message}`,
            };
        }
        const urlViolations = (0, node_tool_validation_1.findHttpRequestToolUrlFromAiViolations)(config.tools).filter(({ toolIndex }) => config.tools?.[toolIndex].enabled !== false);
        if (urlViolations.length > 0) {
            return {
                valid: false,
                error: urlViolations
                    .map(({ toolName, path }) => `HTTP Request tool "${toolName}" cannot use $fromAI in ${path}. Enter a fixed URL.`)
                    .join('\n'),
            };
        }
        const nodeError = await (0, node_tool_validation_1.validateNodeToolConfigs)(config.tools);
        if (nodeError) {
            return { valid: false, error: nodeError };
        }
        return { valid: true, config };
    }
};
exports.AgentConfigPreparationService = AgentConfigPreparationService;
exports.AgentConfigPreparationService = AgentConfigPreparationService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [credentials_service_1.CredentialsService, db_1.WorkflowRepository, node_tool_ai_gateway_service_1.NodeToolAiGatewayService])
], AgentConfigPreparationService);
function hasNodeToolInputSchema(raw) {
    if (!(0, is_record_1.isRecord)(raw) || !Array.isArray(raw.tools))
        return false;
    return raw.tools.some((tool) => (0, is_record_1.isRecord)(tool) && tool.type === 'node' && 'inputSchema' in tool);
}
//# sourceMappingURL=agent-config-preparation.service.js.map