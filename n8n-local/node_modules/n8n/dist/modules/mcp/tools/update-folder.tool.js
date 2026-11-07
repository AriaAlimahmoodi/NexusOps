"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateFolderTool = void 0;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const folder_error_utils_1 = require("./folder-error.utils");
const schemas_1 = require("./schemas");
const inputSchema = {
    projectId: zod_1.default
        .string()
        .describe('The ID of the project the folder belongs to. Use search_projects to resolve a project name to an ID.'),
    folderId: api_types_1.folderIdSchema.describe('The ID of the folder to update. Use search_folders to find it by name.'),
    name: api_types_1.folderNameSchema.optional().describe('New name for the folder (rename)'),
    parentFolderId: api_types_1.folderIdSchema
        .optional()
        .describe(`New parent folder ID to move the folder under. Must belong to the same project and must not be a descendant of the folder being moved. Pass "${n8n_workflow_1.PROJECT_ROOT}" to move the folder to the project root. Omit to leave the folder where it is.`),
};
const createUpdateFolderTool = (user, folderService, projectService, telemetry) => ({
    name: 'update_folder',
    config: {
        description: 'Rename a folder and/or move it under another folder in the same project. Resolve folders by name with search_folders first; when multiple folders match a name, ask the user which one they meant before updating. After the update, confirm the result to the user using folder names, not IDs.',
        inputSchema,
        outputSchema: schemas_1.folderOutputSchema,
        annotations: {
            title: 'Update Folder',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ projectId, folderId, name, parentFolderId, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'update_folder',
            parameters: { projectId, folderId, hasName: !!name, hasParentFolderId: !!parentFolderId },
        };
        const fail = (0, folder_error_utils_1.createFailHandler)(telemetry, telemetryPayload);
        if (!name && !parentFolderId) {
            return fail('Provide at least one of name or parentFolderId');
        }
        try {
            const project = await projectService.getProjectWithScope(user, projectId, ['folder:update']);
            if (!project) {
                return fail('Project not found or access denied');
            }
            const folder = await folderService.updateFolder(folderId, projectId, {
                name,
                parentFolderId,
            });
            telemetryPayload.results = { success: true, data: { folderId } };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = {
                id: folder.id,
                name: folder.name,
                parentFolderId: folder.parentFolderId ?? null,
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (error) {
            return fail((0, folder_error_utils_1.describeFolderError)(error));
        }
    },
});
exports.createUpdateFolderTool = createUpdateFolderTool;
//# sourceMappingURL=update-folder.tool.js.map