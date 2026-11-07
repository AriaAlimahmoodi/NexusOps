"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublishWorkflowTool = void 0;
const api_types_1 = require("@n8n/api-types");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const workflow_publish_blocked_error_1 = require("../../../errors/response-errors/workflow-publish-blocked.error");
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const inputSchema = zod_1.default.object({
    workflowId: zod_1.default.string().describe('The ID of the workflow to publish'),
    versionId: zod_1.default
        .string()
        .optional()
        .describe('Optional version ID to publish. If not provided, publishes the current draft version.'),
});
const outputSchema = {
    success: zod_1.default.boolean(),
    workflowId: zod_1.default.string(),
    activeVersionId: zod_1.default.string().nullable(),
    error: zod_1.default.string().optional(),
    reason: api_types_1.workflowPublishBlockedDetailsShape.reason.optional(),
    workflowReviewRequestId: api_types_1.workflowPublishBlockedDetailsShape.workflowReviewRequestId.optional(),
};
const extractErrorReason = (error) => {
    if (error instanceof workflow_publish_blocked_error_1.WorkflowPublishBlockedError)
        return error.details.reason;
    if (error instanceof mcp_errors_1.WorkflowAccessError)
        return error.reason;
    return undefined;
};
const createPublishWorkflowTool = (user, workflowFinderService, workflowService, telemetry, collaborationService) => ({
    name: 'publish_workflow',
    config: {
        description: 'Publish (activate) a workflow to make it available for production execution. This creates an active version from the current draft.',
        inputSchema: inputSchema.shape,
        outputSchema,
        annotations: {
            title: 'Publish Workflow',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, versionId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'publish_workflow',
            parameters: { workflowId, versionId },
        };
        try {
            await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:publish'], workflowFinderService);
            await collaborationService.ensureWorkflowEditable(workflowId);
            const activatedWorkflow = await workflowService.activateWorkflow(user, workflowId, {
                versionId,
                source: 'n8n-mcp',
                publishHistory: 'none',
            });
            void collaborationService.broadcastWorkflowUpdate(workflowId, user.id).catch(() => { });
            const output = {
                success: true,
                workflowId: activatedWorkflow.id,
                activeVersionId: activatedWorkflow.activeVersionId,
            };
            telemetryPayload.results = {
                success: true,
                data: {
                    workflow_id: workflowId,
                    active_version_id: activatedWorkflow.activeVersionId,
                },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: (0, n8n_workflow_1.jsonStringify)(output) }],
                structuredContent: output,
            };
        }
        catch (er) {
            const error = (0, ensure_error_1.ensureError)(er);
            const publishBlockedDetails = error instanceof workflow_publish_blocked_error_1.WorkflowPublishBlockedError ? error.details : undefined;
            const output = {
                success: false,
                workflowId,
                activeVersionId: null,
                error: error.message,
                ...publishBlockedDetails,
            };
            telemetryPayload.results = {
                success: false,
                error: error.message,
                error_reason: extractErrorReason(error),
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: (0, n8n_workflow_1.jsonStringify)(output) }],
                structuredContent: output,
            };
        }
    },
});
exports.createPublishWorkflowTool = createPublishWorkflowTool;
//# sourceMappingURL=publish-workflow.tool.js.map