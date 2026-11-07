"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetWorkflowVersionTool = void 0;
exports.getWorkflowVersion = getWorkflowVersion;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const schemas_1 = require("./schemas");
const workflow_history_utils_1 = require("./workflow-history.utils");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const inputSchema = {
    workflowId: zod_1.default.string().describe('The ID of the workflow the version belongs to'),
    versionId: zod_1.default.string().describe('The version ID to retrieve, as returned by get_workflow_history'),
};
const outputSchema = {
    success: zod_1.default.boolean(),
    versionId: zod_1.default.string(),
    workflowId: zod_1.default.string(),
    authors: zod_1.default.string().nullable().describe('Who authored this version'),
    name: zod_1.default.string().nullable().describe('Optional named-version label'),
    description: zod_1.default.string().nullable().describe('Optional named-version description'),
    createdAt: zod_1.default.string().nullable().describe('ISO timestamp when the version was created'),
    updatedAt: zod_1.default
        .string()
        .nullable()
        .describe('ISO timestamp when the version metadata was last updated'),
    nodes: zod_1.default.array(schemas_1.nodeSchema).describe('The workflow nodes captured in this version'),
    connections: schemas_1.connectionsSchema.describe('The node connections captured in this version'),
    nodeGroups: zod_1.default.array(schemas_1.nodeGroupSchema).describe('The node groups captured in this version'),
    error: zod_1.default.string().optional(),
};
const createGetWorkflowVersionTool = (user, workflowFinderService, workflowHistoryService, telemetry) => ({
    name: 'get_workflow_version',
    config: {
        description: 'Retrieve the full content (nodes, connections, node groups) of a specific workflow version from its history. Use the versionId from get_workflow_history.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Get Workflow Version',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, versionId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'get_workflow_version',
            parameters: { workflowId, versionId },
        };
        try {
            const payload = await getWorkflowVersion(user, workflowFinderService, workflowHistoryService, { workflowId, versionId });
            const output = { success: true, ...payload };
            telemetryPayload.results = {
                success: true,
                data: { workflow_id: workflowId, version_id: versionId },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (er) {
            const error = (0, ensure_error_1.ensureError)(er);
            const isAccessError = error instanceof mcp_errors_1.WorkflowAccessError;
            const output = {
                success: false,
                versionId,
                workflowId,
                authors: null,
                name: null,
                description: null,
                createdAt: null,
                updatedAt: null,
                nodes: [],
                connections: {},
                nodeGroups: [],
                error: error.message,
            };
            telemetryPayload.results = {
                success: false,
                error: error.message,
                error_reason: isAccessError ? error.reason : undefined,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createGetWorkflowVersionTool = createGetWorkflowVersionTool;
async function getWorkflowVersion(user, workflowFinderService, workflowHistoryService, { workflowId, versionId }) {
    await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:read'], workflowFinderService);
    const version = await (0, workflow_history_utils_1.getMcpWorkflowVersion)(workflowHistoryService, user, workflowId, versionId);
    const nodes = (version.nodes ?? []).map(schemas_1.sanitizeNodeCredentials);
    return {
        versionId: version.versionId,
        workflowId: version.workflowId,
        authors: version.authors,
        name: version.name,
        description: version.description,
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt.toISOString(),
        nodes,
        connections: version.connections ?? {},
        nodeGroups: (0, schemas_1.toNodeGroupSummary)(version.nodeGroups ?? [], version.nodes ?? []),
    };
}
//# sourceMappingURL=get-workflow-version.tool.js.map