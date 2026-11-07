"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMoveWorkflowsToFolderTool = void 0;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const folder_not_found_error_1 = require("../../../errors/folder-not-found.error");
const workflow_entity_mapper_1 = require("../../../workflows/workflow-entity-mapper");
const mcp_constants_1 = require("../mcp.constants");
const folder_error_utils_1 = require("./folder-error.utils");
const workflow_validation_utils_1 = require("./workflow-validation.utils");
const MAX_WORKFLOWS = 20;
const inputSchema = {
    workflowIds: zod_1.default
        .array(zod_1.default.string())
        .min(1)
        .max(MAX_WORKFLOWS)
        .describe(`The IDs of the workflows to move (up to ${MAX_WORKFLOWS} at a time)`),
    folderId: api_types_1.folderIdSchema.describe(`The ID of the destination folder. It must belong to the project that owns the workflows — use search_folders to find it by name. Pass "${n8n_workflow_1.PROJECT_ROOT}" to move the workflows to the project root.`),
};
const outputSchema = {
    folder: zod_1.default
        .object({
        id: zod_1.default.string().describe('The ID of the destination folder'),
        name: zod_1.default.string().describe('The name of the destination folder'),
    })
        .optional()
        .describe('The destination folder. Omitted when moving to the project root.'),
    moved: zod_1.default
        .array(zod_1.default.object({
        workflowId: zod_1.default.string().describe('The ID of the moved workflow'),
        name: zod_1.default.string().describe('The name of the moved workflow'),
    }))
        .optional()
        .describe('Workflows that were moved successfully'),
    failed: zod_1.default
        .array(zod_1.default.object({
        workflowId: zod_1.default.string().describe('The ID of the workflow that could not be moved'),
        error: zod_1.default.string().describe('Why the workflow could not be moved'),
    }))
        .optional()
        .describe('Workflows that could not be moved, with the reason for each'),
    error: zod_1.default
        .string()
        .optional()
        .describe('Error message explaining why the move failed. Present only on failure.'),
};
const createMoveWorkflowsToFolderTool = (user, workflowFinderService, workflowService, folderFinderService, telemetry) => ({
    name: 'move_workflows_to_folder',
    config: {
        description: 'Move one or more existing workflows into a folder (or to the project root). The destination folder must be in the same project as the workflows. Resolve the folder by name with search_folders first; when multiple folders match the name, ask the user which one they meant before moving. After moving, confirm the destination to the user by folder name, not ID. Moves may partially succeed — report any entries in `failed` to the user.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Move Workflows to Folder',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ workflowIds, folderId }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'move_workflows_to_folder',
            parameters: { workflowCount: workflowIds.length, folderId },
        };
        const fail = (0, folder_error_utils_1.createFailHandler)(telemetry, telemetryPayload);
        try {
            let folder;
            if (folderId !== n8n_workflow_1.PROJECT_ROOT) {
                [folder] = await folderFinderService.findFoldersByIdsForUser([folderId], user, [
                    'folder:read',
                ]);
                if (!folder) {
                    return fail((0, folder_error_utils_1.describeFolderError)(new folder_not_found_error_1.FolderNotFoundError(folderId)));
                }
            }
            const accessibleWorkflows = await workflowFinderService.findWorkflowsByIdsForUser(workflowIds, user, ['workflow:update']);
            const workflowsById = new Map(accessibleWorkflows.map((workflow) => [workflow.id, workflow]));
            const moved = [];
            const failed = [];
            for (const workflowId of workflowIds) {
                try {
                    const workflow = (0, workflow_validation_utils_1.validateMcpWorkflow)(workflowsById.get(workflowId));
                    await workflowService.update(user, (0, workflow_entity_mapper_1.createWorkflowEntityFromPayload)({}), workflowId, {
                        parentFolderId: folderId,
                        source: 'n8n-mcp',
                    });
                    moved.push({ workflowId, name: workflow.name });
                }
                catch (error) {
                    failed.push({ workflowId, error: (0, folder_error_utils_1.describeFolderError)(error) });
                }
            }
            const anyMoved = moved.length > 0;
            telemetryPayload.results = {
                success: anyMoved,
                data: { movedCount: moved.length, failedCount: failed.length },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = {
                ...(folder ? { folder: { id: folder.id, name: folder.name } } : {}),
                ...(anyMoved ? { moved } : { error: 'None of the workflows could be moved' }),
                ...(failed.length > 0 ? { failed } : {}),
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
                ...(anyMoved ? {} : { isError: true }),
            };
        }
        catch (error) {
            return fail((0, folder_error_utils_1.describeFolderError)(error));
        }
    },
});
exports.createMoveWorkflowsToFolderTool = createMoveWorkflowsToFolderTool;
//# sourceMappingURL=move-workflows-to-folder.tool.js.map