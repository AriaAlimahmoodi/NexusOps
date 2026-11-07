"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetWorkflowHistoryTool = void 0;
exports.getWorkflowHistory = getWorkflowHistory;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const schemas_1 = require("./schemas");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const MAX_RESULTS = 50;
const inputSchema = {
    workflowId: zod_1.default.string().describe('The ID of the workflow to read version history for'),
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
    offset: zod_1.default
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe('Number of versions to skip for pagination (default 0)'),
};
const versionSummarySchema = zod_1.default.object({
    versionId: zod_1.default.string().describe('The version ID, usable with get_workflow_version'),
    authors: zod_1.default.string().describe('Who authored this version'),
    name: zod_1.default.string().nullable().describe('Optional named-version label'),
    description: zod_1.default.string().nullable().describe('Optional named-version description'),
    autosaved: zod_1.default.boolean().describe('Whether this version was autosaved'),
    createdAt: zod_1.default.string().describe('ISO timestamp when the version was created'),
    updatedAt: zod_1.default.string().describe('ISO timestamp when the version metadata was last updated'),
});
const outputSchema = {
    success: zod_1.default.boolean(),
    workflowId: zod_1.default.string(),
    versions: zod_1.default
        .array(versionSummarySchema)
        .describe('Versions ordered newest first. Older versions may be pruned by retention settings.'),
    count: zod_1.default.number().describe('Number of versions returned in this page'),
    error: zod_1.default.string().optional(),
};
const createGetWorkflowHistoryTool = (user, workflowFinderService, workflowHistoryService, telemetry) => ({
    name: 'get_workflow_history',
    config: {
        description: 'List the saved version history of a workflow (newest first), so you can inspect how it changed over time and pick a version to retrieve or restore.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Get Workflow History',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, limit = MAX_RESULTS, offset = 0 }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'get_workflow_history',
            parameters: { workflowId, limit, offset },
        };
        try {
            const payload = await getWorkflowHistory(user, workflowFinderService, workflowHistoryService, { workflowId, limit, offset });
            const output = { success: true, ...payload };
            telemetryPayload.results = {
                success: true,
                data: { workflow_id: workflowId, version_count: payload.count },
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
                workflowId,
                versions: [],
                count: 0,
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
exports.createGetWorkflowHistoryTool = createGetWorkflowHistoryTool;
async function getWorkflowHistory(user, workflowFinderService, workflowHistoryService, { workflowId, limit = MAX_RESULTS, offset = 0 }) {
    await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:read'], workflowFinderService);
    const versions = await workflowHistoryService.getList(user, workflowId, limit, offset);
    const formatted = versions.map((version) => ({
        versionId: version.versionId,
        authors: version.authors,
        name: version.name,
        description: version.description,
        autosaved: version.autosaved,
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt.toISOString(),
    }));
    return { workflowId, versions: formatted, count: formatted.length };
}
//# sourceMappingURL=get-workflow-history.tool.js.map