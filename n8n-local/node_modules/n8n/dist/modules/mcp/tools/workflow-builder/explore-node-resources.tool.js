"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExploreNodeResourcesTool = void 0;
const scrub_secrets_1 = require("@n8n/utils/scrub-secrets");
const truncate_1 = require("@n8n/utils/string/truncate");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("./constants");
const mcp_constants_1 = require("../../mcp.constants");
const inputSchema = {
    nodeType: zod_1.default
        .string()
        .describe('Fully-qualified node type ID from search_nodes / get_node_types, e.g. "n8n-nodes-base.slack".'),
    version: zod_1.default
        .number()
        .describe('Node version, e.g. 4.7. Must match a version returned by search_nodes.'),
    methodName: zod_1.default
        .string()
        .describe("The exact method name from the node's `@searchListMethod` or `@loadOptionsMethod` annotation in the type definition. " +
        'Call get_node_types first to read the real method name. Do not invent or guess.'),
    methodType: zod_1.default
        .enum(['listSearch', 'loadOptions'])
        .describe('"listSearch" for `@searchListMethod` annotations (supports filter/pagination); ' +
        '"loadOptions" for `@loadOptionsMethod` annotations.'),
    credentialType: zod_1.default
        .string()
        .describe('Credential type key for the node, e.g. "slackApi" or "googleSheetsOAuth2Api".'),
    credentialId: zod_1.default
        .string()
        .describe('ID of a credential the user can access, obtained from list_credentials.'),
    filter: zod_1.default.string().optional().describe('Optional search/filter text to narrow results.'),
    paginationToken: zod_1.default
        .string()
        .optional()
        .describe('Pagination token from a previous call to fetch the next page (listSearch only).'),
    currentNodeParameters: zod_1.default
        .record(zod_1.default.unknown())
        .optional()
        .describe('Current node parameters for dependent lookups. Some methods require prior selections — ' +
        'e.g. listing sheets within a spreadsheet needs `{ documentId: { __rl: true, mode: "id", value: "<spreadsheetId>" } }`. ' +
        "Check the type definition's displayOptions to know which parameters a method depends on."),
};
const outputSchema = {
    results: zod_1.default
        .array(zod_1.default.object({
        name: zod_1.default.string(),
        value: zod_1.default.union([zod_1.default.string(), zod_1.default.number(), zod_1.default.boolean()]),
        url: zod_1.default.string().optional(),
        description: zod_1.default.string().optional(),
    }))
        .describe('Resources returned by the node method. `value` is the id to use in workflow code.'),
    paginationToken: zod_1.default
        .string()
        .optional()
        .describe('Pass back as `paginationToken` to fetch the next page. Absent if no more results.'),
    builderHint: zod_1.default
        .string()
        .optional()
        .describe("Selection guidance from the node's @builderHint annotation, when present."),
    error: zod_1.default.string().optional().describe('Error message when the lookup failed.'),
    httpCode: zod_1.default
        .string()
        .optional()
        .describe('HTTP status code the upstream API returned, when the lookup failed on an API call.'),
    errorDescription: zod_1.default
        .string()
        .optional()
        .describe("The upstream API's own error text, when the lookup failed on an API call. " +
        'Use it to tell a missing permission apart from an invalid credential.'),
};
const MAX_ERROR_DESCRIPTION_CHARS = 4_000;
function toErrorOutput(error) {
    const output = {
        results: [],
        error: (0, scrub_secrets_1.scrubSecretsInText)(error instanceof Error ? error.message : String(error)),
    };
    if (error instanceof n8n_workflow_1.NodeApiError) {
        if (error.httpCode)
            output.httpCode = error.httpCode;
        if (error.description) {
            output.errorDescription = (0, truncate_1.truncate)((0, scrub_secrets_1.scrubSecretsInText)(error.description), MAX_ERROR_DESCRIPTION_CHARS);
        }
    }
    return output;
}
const createExploreNodeResourcesTool = (user, nodeResourceExplorerService, telemetry) => ({
    name: constants_1.MCP_EXPLORE_NODE_RESOURCES_TOOL.toolName,
    config: {
        description: "Resolve the real values behind a node's resource locator or load-options dropdown (e.g. Slack channels, Google Sheets tabs, OpenAI models). " +
            'Use this after get_node_types so you ground RLC and load-options parameters in real IDs instead of inventing them. ' +
            'Requires a credential ID from list_credentials — the call runs as the current user with that credential.',
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.MCP_EXPLORE_NODE_RESOURCES_TOOL.displayTitle,
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    handler: async (params) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.MCP_EXPLORE_NODE_RESOURCES_TOOL.toolName,
            parameters: {
                nodeType: params.nodeType,
                version: params.version,
                methodName: params.methodName,
                methodType: params.methodType,
                credentialType: params.credentialType,
                hasFilter: params.filter !== undefined,
                hasPaginationToken: params.paginationToken !== undefined,
                hasCurrentNodeParameters: params.currentNodeParameters !== undefined,
            },
        };
        try {
            const result = await nodeResourceExplorerService.exploreResources(user, params);
            telemetryPayload.results = {
                success: true,
                data: {
                    resultCount: result.results.length,
                    hasPaginationToken: result.paginationToken !== undefined,
                    hasBuilderHint: result.builderHint !== undefined,
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(result) }],
                structuredContent: { ...result },
            };
        }
        catch (error) {
            telemetryPayload.results = {
                success: false,
                error: error instanceof Error ? error.name : 'UnknownError',
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = toErrorOutput(error);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createExploreNodeResourcesTool = createExploreNodeResourcesTool;
//# sourceMappingURL=explore-node-resources.tool.js.map