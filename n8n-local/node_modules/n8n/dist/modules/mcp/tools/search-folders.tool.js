"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchFoldersTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const schemas_1 = require("./schemas");
const tool_error_utils_1 = require("./tool-error.utils");
const MAX_RESULTS = 100;
const inputSchema = {
    projectId: zod_1.default.string().describe('The ID of the project to search folders in'),
    query: zod_1.default.string().optional().describe('Filter folders by name (case-insensitive partial match)'),
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
};
const outputSchema = {
    data: zod_1.default
        .array(zod_1.default.object({
        id: zod_1.default.string().describe('The unique identifier of the folder'),
        name: zod_1.default.string().describe('The name of the folder'),
        parentFolderId: zod_1.default
            .string()
            .nullable()
            .describe('The ID of the parent folder, or null if at project root'),
        path: zod_1.default
            .array(zod_1.default.string())
            .describe("The folder's full name path from the project root, ending with the folder's own name. Use it to tell same-named folders apart and to present folders to the user by name."),
    }))
        .describe('List of folders matching the query'),
    count: zod_1.default.number().int().min(0).describe('Total number of matching folders'),
    error: zod_1.default
        .string()
        .optional()
        .describe('Error message explaining why the search failed. Present only on failure.'),
};
const createSearchFoldersTool = (user, folderService, projectService, telemetry) => ({
    name: 'search_folders',
    config: {
        description: "Search for folders within a project. Use this to resolve a folder name to an ID before searching workflows inside a folder, creating a workflow in a folder, creating or updating a folder, or moving workflows into a folder. Each result includes the folder's full name path — when multiple folders match a name, use the paths to ask the user which one they meant. Requires a projectId — use search_projects first if needed.",
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Search Folders',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ projectId, query, limit = MAX_RESULTS, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'search_folders',
            parameters: { projectId, query, limit },
        };
        try {
            const project = await projectService.getProjectWithScope(user, projectId, ['folder:list']);
            if (!project) {
                const output = { data: [], count: 0, error: 'Project not found or access denied' };
                telemetryPayload.results = { success: false, error: output.error };
                telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(output) }],
                    structuredContent: output,
                    isError: true,
                };
            }
            const safeLimit = Math.min(Math.max(1, limit), MAX_RESULTS);
            const [folders, count] = await folderService.getManyAndCount(projectId, {
                filter: query ? { name: query } : {},
                select: { name: true, parentFolder: true, path: true, updatedAt: true },
                take: safeLimit,
            });
            const data = folders.map((folder) => ({
                id: folder.id,
                name: folder.name,
                parentFolderId: folder.parentFolder?.id ?? null,
                path: folder.path ?? [folder.name],
            }));
            telemetryPayload.results = {
                success: true,
                data: { count },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = { data, count };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (error) {
            return (0, tool_error_utils_1.trackAndReturnToolError)(telemetry, telemetryPayload, error, (message) => ({
                data: [],
                count: 0,
                error: message,
            }));
        }
    },
});
exports.createSearchFoldersTool = createSearchFoldersTool;
//# sourceMappingURL=search-folders.tool.js.map