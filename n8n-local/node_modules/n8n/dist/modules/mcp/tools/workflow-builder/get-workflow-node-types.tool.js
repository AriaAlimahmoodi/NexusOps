"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetWorkflowNodeTypesTool = void 0;
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("./constants");
const mcp_ai_gateway_helper_1 = require("../../mcp-ai-gateway.helper");
const mcp_constants_1 = require("../../mcp.constants");
const tool_error_utils_1 = require("../tool-error.utils");
const nodeRequestSchema = zod_1.default.object({
    nodeId: zod_1.default.string().describe('The node type ID (e.g. "n8n-nodes-base.gmail")'),
    version: zod_1.default.string().optional().describe('Specific version (e.g. "2.1")'),
    resource: zod_1.default.string().optional().describe('Resource discriminator (e.g. "message")'),
    operation: zod_1.default.string().optional().describe('Operation discriminator (e.g. "send")'),
    mode: zod_1.default.string().optional().describe('Mode discriminator'),
});
const inputSchema = {
    nodeIds: zod_1.default
        .array(nodeRequestSchema)
        .min(1)
        .describe('Node type requests to get definitions for. Always pass an array of objects, even for a single node. Include discriminators from search_nodes results when available.'),
};
const outputSchema = {
    definitions: zod_1.default.string().describe('TypeScript type definitions for the requested nodes'),
    gatewayCredits: zod_1.default
        .object({
        credentialTypes: zod_1.default
            .array(zod_1.default.string())
            .describe('Credential types Gateway credits can provide.'),
        nodes: zod_1.default
            .array(zod_1.default.string())
            .describe('Node types Gateway credits may cover. Prefer these when the user has not specified an integration. Candidate coverage only — exact eligibility also depends on the node action, minimum type version, and hidden properties.'),
    })
        .optional()
        .describe(`Present when Gateway credits are available. Candidate coverage — cross-reference against the returned node types, but call ${mcp_constants_1.LIST_N8N_GATEWAY_SERVICES_TOOL_NAME} for exact eligibility (supported actions, min versions, hidden properties).`),
};
const createGetWorkflowNodeTypesTool = (user, nodeCatalogService, telemetry, aiGatewayService, includeUninstalled = false) => ({
    name: constants_1.CODE_BUILDER_GET_NODE_TYPES_TOOL.toolName,
    config: {
        description: 'Get TypeScript type definitions for n8n nodes. Returns exact parameter names and structures. MUST be called before writing workflow code or configuring node-backed tools — guessing parameter names creates invalid configurations. Pass nodeIds as an array of objects like { nodeId: "n8n-nodes-base.gmail" }. Include discriminators (resource/operation/mode) from search_nodes results.',
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.CODE_BUILDER_GET_NODE_TYPES_TOOL.displayTitle,
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ nodeIds }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.CODE_BUILDER_GET_NODE_TYPES_TOOL.toolName,
            parameters: { nodeIdCount: nodeIds.length },
        };
        try {
            const [result, availability] = await Promise.all([
                nodeCatalogService.getNodeTypes(nodeIds, { includeUninstalled }),
                aiGatewayService.isAvailable(),
            ]);
            telemetryPayload.results = { success: true, data: { nodeIdCount: nodeIds.length } };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const structured = { definitions: result };
            const coverage = (0, mcp_ai_gateway_helper_1.toN8nConnectCoverage)(availability);
            if (coverage)
                structured.gatewayCredits = coverage;
            const text = coverage ? `${result}\n\ngatewayCredits: ${JSON.stringify(coverage)}` : result;
            return {
                content: [{ type: 'text', text }],
                structuredContent: structured,
            };
        }
        catch (error) {
            (0, tool_error_utils_1.trackAndRethrowToolError)(telemetry, telemetryPayload, error);
        }
    },
});
exports.createGetWorkflowNodeTypesTool = createGetWorkflowNodeTypesTool;
//# sourceMappingURL=get-workflow-node-types.tool.js.map