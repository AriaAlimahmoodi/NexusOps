"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCreateFolderTool = void 0;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const folder_error_utils_1 = require("./folder-error.utils");
const schemas_1 = require("./schemas");
const inputSchema = {
    projectId: zod_1.default
        .string()
        .describe('The ID of the project to create the folder in. Use search_projects to resolve a project name to an ID.'),
    name: api_types_1.folderNameSchema.describe('The name of the folder to create'),
    parentFolderId: api_types_1.folderIdSchema
        .optional()
        .describe(`Optional parent folder ID to nest the new folder under. Must belong to the same project — use search_folders to find it. Omit it or pass "${n8n_workflow_1.PROJECT_ROOT}" to create the folder at the project root.`),
};
const createCreateFolderTool = (user, folderService, projectService, telemetry) => ({
    name: 'create_folder',
    config: {
        description: 'Create a folder in a project, optionally nested under an existing folder. Requires a projectId — use search_projects first if needed. If the user named a parent folder, resolve it with search_folders; when multiple folders match the name, ask the user which one they meant before creating. After creation, confirm the folder to the user by name, not ID.',
        inputSchema,
        outputSchema: schemas_1.folderOutputSchema,
        annotations: {
            title: 'Create Folder',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ projectId, name, parentFolderId, }) => {
        const parent = parentFolderId === n8n_workflow_1.PROJECT_ROOT ? undefined : parentFolderId;
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'create_folder',
            parameters: { projectId, hasParentFolderId: !!parent },
        };
        const fail = (0, folder_error_utils_1.createFailHandler)(telemetry, telemetryPayload);
        try {
            const project = await projectService.getProjectWithScope(user, projectId, ['folder:create']);
            if (!project) {
                return fail('Project not found or access denied');
            }
            const folder = await folderService.createFolder({ name, parentFolderId: parent }, projectId);
            telemetryPayload.results = { success: true, data: { folderId: folder.id } };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = {
                id: folder.id,
                name: folder.name,
                parentFolderId: folder.parentFolder?.id ?? null,
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
exports.createCreateFolderTool = createCreateFolderTool;
//# sourceMappingURL=create-folder.tool.js.map