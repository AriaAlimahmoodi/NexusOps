"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchWorkflowNodesTool = void 0;
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("./constants");
const mcp_ai_gateway_helper_1 = require("../../mcp-ai-gateway.helper");
const mcp_constants_1 = require("../../mcp.constants");
const tool_error_utils_1 = require("../tool-error.utils");
const inputSchema = {
    queries: zod_1.default
        .array(zod_1.default.string())
        .min(1)
        .describe('Search queries for n8n nodes — service names (e.g. "gmail", "slack"), trigger types (e.g. "schedule trigger", "webhook"), or utility nodes (e.g. "set", "if", "merge", "code")'),
    usage: zod_1.default
        .enum(['workflow', 'agentTool'])
        .optional()
        .describe('Use agentTool to return only nodes that can be configured as Agent tools; defaults to workflow'),
};
const outputSchema = {
    results: zod_1.default
        .string()
        .describe('Search results with matching node IDs, discriminators, and related nodes'),
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
        .describe(`Present when Gateway credits are available. Candidate coverage — cross-reference against the search results, but call ${mcp_constants_1.LIST_N8N_GATEWAY_SERVICES_TOOL_NAME} for exact eligibility (supported actions, min versions, hidden properties).`),
};
const createSearchWorkflowNodesTool = (user, nodeCatalogService, telemetry, aiGatewayService, includeUninstalled = false) => ({
    name: constants_1.CODE_BUILDER_SEARCH_NODES_TOOL.toolName,
    config: {
        description: 'Search for n8n nodes by service name, trigger type, or utility function. Set usage="agentTool" to return only Agent-compatible tool nodes. Returns node IDs, discriminators (resource/operation/mode), and related nodes needed for get_node_types.',
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.CODE_BUILDER_SEARCH_NODES_TOOL.displayTitle,
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ queries, usage }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.CODE_BUILDER_SEARCH_NODES_TOOL.toolName,
            parameters: { queries, usage },
        };
        try {
            const options = { includeUninstalled };
            if (usage === 'agentTool') {
                options.nodeFilter = (await import('../../../../modules/agents/agents-tools.service.js')).isAgentToolNodeType;
            }
            const [{ results, queriesWithNoResults, uninstalledOffered }, availability] = await Promise.all([
                nodeCatalogService.searchNodes(queries, options),
                aiGatewayService.isAvailable(),
            ]);
            telemetryPayload.results = {
                success: true,
                data: {
                    queryCount: queries.length,
                    noResultQueryCount: queriesWithNoResults.length,
                    queriesWithNoResults,
                    ...(includeUninstalled
                        ? { uninstalledOfferedCount: uninstalledOffered?.length ?? 0 }
                        : {}),
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const structured = {
                results,
            };
            const coverage = (0, mcp_ai_gateway_helper_1.toN8nConnectCoverage)(availability);
            if (coverage)
                structured.gatewayCredits = coverage;
            const text = coverage ? `${results}\n\ngatewayCredits: ${JSON.stringify(coverage)}` : results;
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
exports.createSearchWorkflowNodesTool = createSearchWorkflowNodesTool;
//# sourceMappingURL=search-workflow-nodes.tool.js.map