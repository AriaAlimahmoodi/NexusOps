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
exports.AgentsToolsService = exports.isAgentToolNodeType = exports.isExecutableNodeType = void 0;
const tool_1 = require("@n8n/agents/tool");
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const node_catalog_1 = require("../../node-catalog");
const node_execution_1 = require("../../node-execution");
const builder_tool_names_1 = require("./builder/builder-tool-names");
const node_description_transform_1 = require("../mcp-registry/node-description-transform");
const isExecutableNodeType = (nodeId) => !(0, n8n_workflow_1.isTriggerNodeType)(nodeId);
exports.isExecutableNodeType = isExecutableNodeType;
const hiddenAgentToolNodeTypes = new Set(api_types_1.AGENT_BUILDER_HIDDEN_AVAILABLE_TOOL_NODE_TYPES);
const isAgentToolNodeType = (nodeId) => {
    if (!(0, exports.isExecutableNodeType)(nodeId)) {
        return false;
    }
    if (hiddenAgentToolNodeTypes.has(nodeId)) {
        return false;
    }
    return (0, n8n_workflow_1.isToolType)(nodeId, { includeHitl: false }) && !isMcpToolNodeType(nodeId);
};
exports.isAgentToolNodeType = isAgentToolNodeType;
const MCP_CLIENT_TOOL_NODE_TYPE = '@n8n/n8n-nodes-langchain.mcpClientTool';
const isMcpToolNodeType = (nodeId) => nodeId === MCP_CLIENT_TOOL_NODE_TYPE || nodeId.startsWith(node_description_transform_1.MCP_REGISTRY_PACKAGE_NAME);
const searchNodesInputSchema = zod_1.z.object({
    queries: zod_1.z.array(zod_1.z.string()).min(1).describe('Search queries (e.g., ["gmail", "slack", "http"])'),
});
const nodeVersionSchema = zod_1.z
    .number()
    .describe('Tool node type version from agent_builder_search_nodes or agent-context integration results with kind "node"');
const getNodeTypesInputSchema = zod_1.z.object({
    nodeIds: zod_1.z
        .array(zod_1.z.union([
        zod_1.z.string(),
        zod_1.z.object({
            nodeId: zod_1.z.string(),
            version: nodeVersionSchema.optional(),
            resource: zod_1.z.string().optional(),
            operation: zod_1.z.string().optional(),
            mode: zod_1.z.string().optional(),
        }),
    ]))
        .min(1)
        .describe('Tool node IDs from agent_builder_search_nodes or agent-context integration results with kind "node"; e.g., ["n8n-nodes-base.gmailTool"]'),
});
const listCredentialsInputSchema = zod_1.z.object({
    types: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe('Optional credential types to filter by (e.g., ["gmailOAuth2", "httpHeaderAuth"]). ' +
        'When omitted, returns all credentials. Use the credential types declared in the ' +
        'node schema from agent_builder_get_node_types to narrow the results.'),
});
let AgentsToolsService = class AgentsToolsService {
    constructor(nodeCatalogService) {
        this.nodeCatalogService = nodeCatalogService;
    }
    getSharedTools(credentialProvider, listCredentialsUsageHint) {
        return [
            this.buildSearchNodesTool(),
            this.buildGetNodeTypesTool(),
            this.buildListCredentialsTool(credentialProvider, listCredentialsUsageHint),
        ];
    }
    async searchAgentToolNodes(queries) {
        await this.nodeCatalogService.initialize();
        return await this.nodeCatalogService.searchNodes(queries, {
            nodeFilter: exports.isAgentToolNodeType,
        });
    }
    buildSearchNodesTool() {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.SEARCH_NODES)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.SEARCH_NODES))
            .description('Search for n8n nodes by name or service. Use this to find nodes that can be executed. ' +
            'Returns tool node IDs, display names, versions, and descriptions. ' +
            'After finding a node, call agent_builder_get_node_types to get its parameter schema. ' +
            'Also consider n8n Connect covered services relevant to the task (they run on Gateway ' +
            'credits, no API key needed) — e.g. web search, scraping, or document parsing services.')
            .input(searchNodesInputSchema)
            .handler(async ({ queries }) => {
            const { results } = await this.searchAgentToolNodes(queries);
            return { results };
        })
            .build();
    }
    buildGetNodeTypesTool() {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.GET_NODE_TYPES)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.GET_NODE_TYPES))
            .description('Get detailed parameter schema for specific n8n nodes. Use the node IDs from node ' +
            'discovery results (agent_builder_search_nodes or agent-context integrations with kind "node"). Returns ' +
            'parameter definitions needed to configure a node for execution. Use the tool node ' +
            'IDs from discovery, usually ending in Tool. You can optionally filter by ' +
            'resource/operation/mode.')
            .input(getNodeTypesInputSchema)
            .handler(async ({ nodeIds }) => {
            const unsupportedOperations = nodeIds.flatMap((request) => {
                if (typeof request === 'string' ||
                    !(0, node_execution_1.isUnsupportedEphemeralNodeOperation)(request.operation)) {
                    return [];
                }
                return [
                    `Node "${request.nodeId}": ${(0, node_execution_1.unsupportedEphemeralNodeOperationMessage)(request.operation)}`,
                ];
            });
            if (unsupportedOperations.length > 0) {
                return { results: `# Errors\n\n${unsupportedOperations.join('\n')}` };
            }
            await this.nodeCatalogService.initialize();
            const results = await this.nodeCatalogService.getNodeTypes(nodeIds.map(normalizeNodeRequestForCatalog));
            return { results };
        })
            .build();
    }
    buildListCredentialsTool(credentialProvider, usageHint) {
        return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.LIST_CREDENTIALS)
            .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.LIST_CREDENTIALS))
            .description('List the credentials available to the user. Returns an array of credential names and types. ' +
            'Accepts an optional `types` filter to return only credentials matching the given types. ' +
            usageHint)
            .input(listCredentialsInputSchema)
            .handler(async ({ types }) => {
            const creds = await credentialProvider.list();
            if (!types || types.length === 0)
                return { credentials: creds };
            const allowed = new Set(types);
            return { credentials: creds.filter((c) => allowed.has(c.type)) };
        })
            .build();
    }
};
exports.AgentsToolsService = AgentsToolsService;
exports.AgentsToolsService = AgentsToolsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [node_catalog_1.NodeCatalogService])
], AgentsToolsService);
function normalizeNodeRequestForCatalog(req) {
    if (typeof req === 'string')
        return req;
    const { version, ...rest } = req;
    return version === undefined ? rest : { ...rest, version: String(version) };
}
//# sourceMappingURL=agents-tools.service.js.map