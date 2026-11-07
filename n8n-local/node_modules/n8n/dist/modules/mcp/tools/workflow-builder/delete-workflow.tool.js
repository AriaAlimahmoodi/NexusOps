"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArchiveWorkflowTool = void 0;
const zod_1 = __importDefault(require("zod"));
const constants_1 = require("./constants");
const mcp_constants_1 = require("../../mcp.constants");
const workflow_validation_utils_1 = require("../workflow-validation.utils");
const inputSchema = {
    workflowId: zod_1.default.string().describe('The ID of the workflow to archive'),
};
const outputSchema = {
    archived: zod_1.default.boolean().describe('Whether the workflow was archived'),
    workflowId: zod_1.default.string().describe('The ID of the archived workflow'),
    name: zod_1.default.string().describe('The name of the archived workflow'),
};
const createArchiveWorkflowTool = (user, workflowFinderService, workflowService, telemetry, collaborationService) => ({
    name: constants_1.MCP_ARCHIVE_WORKFLOW_TOOL.toolName,
    config: {
        description: 'Archive a workflow in n8n by its ID.',
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.MCP_ARCHIVE_WORKFLOW_TOOL.displayTitle,
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.MCP_ARCHIVE_WORKFLOW_TOOL.toolName,
            parameters: { workflowId },
        };
        try {
            await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:delete'], workflowFinderService);
            await collaborationService.ensureWorkflowEditable(workflowId);
            const workflow = await workflowService.archive(user, workflowId, { skipArchived: true });
            if (!workflow) {
                throw new Error("Workflow not found or you don't have permission to archive it.");
            }
            void collaborationService.broadcastWorkflowUpdate(workflowId, user.id).catch(() => { });
            telemetryPayload.results = {
                success: true,
                data: { workflowId },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = {
                archived: true,
                workflowId,
                name: workflow.name,
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            telemetryPayload.results = {
                success: false,
                error: errorMessage,
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = { error: errorMessage };
            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createArchiveWorkflowTool = createArchiveWorkflowTool;
//# sourceMappingURL=delete-workflow.tool.js.map