"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnpublishWorkflowTool = void 0;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_errors_1 = require("../mcp.errors");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const inputSchema = zod_1.default.object({
    workflowId: zod_1.default.string().describe('The ID of the workflow to unpublish'),
});
const outputSchema = {
    success: zod_1.default.boolean(),
    workflowId: zod_1.default.string(),
    error: zod_1.default.string().optional(),
};
const createUnpublishWorkflowTool = (user, workflowFinderService, workflowService, telemetry, collaborationService) => ({
    name: 'unpublish_workflow',
    config: {
        description: 'Unpublish (deactivate) a workflow to stop it from being available for production execution.',
        inputSchema: inputSchema.shape,
        outputSchema,
        annotations: {
            title: 'Unpublish Workflow',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'unpublish_workflow',
            parameters: { workflowId },
        };
        try {
            await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:unpublish'], workflowFinderService);
            await collaborationService.ensureWorkflowEditable(workflowId);
            await workflowService.deactivateWorkflow(user, workflowId, {
                source: 'n8n-mcp',
            });
            void collaborationService.broadcastWorkflowUpdate(workflowId, user.id).catch(() => { });
            const output = {
                success: true,
                workflowId,
            };
            telemetryPayload.results = {
                success: true,
                data: {
                    workflow_id: workflowId,
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
            const isAccessError = error instanceof mcp_errors_1.WorkflowAccessError;
            const output = {
                success: false,
                workflowId,
                error: error.message,
            };
            telemetryPayload.results = {
                success: false,
                error: error.message,
                error_reason: isAccessError ? error.reason : undefined,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: (0, n8n_workflow_1.jsonStringify)(output) }],
                structuredContent: output,
            };
        }
    },
});
exports.createUnpublishWorkflowTool = createUnpublishWorkflowTool;
//# sourceMappingURL=unpublish-workflow.tool.js.map