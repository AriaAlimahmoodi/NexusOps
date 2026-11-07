"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRestoreWorkflowVersionTool = void 0;
const db_1 = require("@n8n/db");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const mcp_errors_1 = require("../../mcp.errors");
const workflow_history_utils_1 = require("../workflow-history.utils");
const workflow_validation_utils_1 = require("../workflow-validation.utils");
const version_metadata_1 = require("./version-metadata");
const inputSchema = zod_1.default.object({
    workflowId: zod_1.default.string().describe('The ID of the workflow to restore'),
    versionId: zod_1.default.string().describe('The version ID to restore, as returned by get_workflow_history'),
});
const outputSchema = {
    success: zod_1.default.boolean(),
    workflowId: zod_1.default.string(),
    restoredFromVersionId: zod_1.default.string(),
    newVersionId: zod_1.default
        .string()
        .nullable()
        .describe('The new current version ID created by the restore, if successful'),
    error: zod_1.default.string().optional(),
};
const createRestoreWorkflowVersionTool = (user, workflowFinderService, workflowHistoryService, workflowService, telemetry, collaborationService) => ({
    name: 'restore_workflow_version',
    config: {
        description: 'Restore a workflow to a previous version from its history. Re-applies that version as the current draft and records a new history entry. Use get_workflow_history to find the versionId.',
        inputSchema: inputSchema.shape,
        outputSchema,
        annotations: {
            title: 'Restore Workflow Version',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId, versionId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'restore_workflow_version',
            parameters: { workflowId, versionId },
        };
        try {
            const existingWorkflow = await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:update'], workflowFinderService);
            await collaborationService.ensureWorkflowEditable(existingWorkflow.id);
            const version = await (0, workflow_history_utils_1.getMcpWorkflowVersion)(workflowHistoryService, user, workflowId, versionId);
            const workflowUpdateData = new db_1.WorkflowEntity();
            Object.assign(workflowUpdateData, {
                nodes: version.nodes,
                connections: version.connections,
                nodeGroups: version.nodeGroups ?? [],
            });
            const versionMetadata = (0, version_metadata_1.buildRestoreVersionMetadata)(version);
            const updatedWorkflow = await workflowService.update(user, workflowUpdateData, workflowId, {
                forceSave: true,
                source: 'n8n-mcp',
                versionName: versionMetadata.name,
                versionDescription: versionMetadata.description,
            });
            void collaborationService.broadcastWorkflowUpdate(workflowId, user.id).catch(() => { });
            const output = {
                success: true,
                workflowId: updatedWorkflow.id,
                restoredFromVersionId: versionId,
                newVersionId: updatedWorkflow.versionId,
            };
            telemetryPayload.results = {
                success: true,
                data: {
                    workflow_id: workflowId,
                    restored_from_version_id: versionId,
                    new_version_id: updatedWorkflow.versionId,
                },
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
                restoredFromVersionId: versionId,
                newVersionId: null,
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
exports.createRestoreWorkflowVersionTool = createRestoreWorkflowVersionTool;
//# sourceMappingURL=restore-workflow-version.tool.js.map