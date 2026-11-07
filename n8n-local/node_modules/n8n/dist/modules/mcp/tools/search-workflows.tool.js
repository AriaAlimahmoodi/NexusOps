"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchWorkflowsTool = void 0;
exports.searchWorkflows = searchWorkflows;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../mcp.constants");
const mcp_types_1 = require("../mcp.types");
const folder_not_found_error_1 = require("../../../errors/folder-not-found.error");
const folder_error_utils_1 = require("./folder-error.utils");
const schemas_1 = require("./schemas");
const MAX_RESULTS = 200;
const FOLDER_ID_PATTERN = /^[A-Za-z0-9-]+$/;
const DEFAULT_SORT_BY = 'updatedAt:desc';
const inputSchema = {
    limit: (0, schemas_1.createLimitSchema)(MAX_RESULTS),
    query: zod_1.default.string().optional().describe('Filter by name or description'),
    projectId: zod_1.default.string().optional(),
    tags: zod_1.default
        .array(zod_1.default.string())
        .optional()
        .describe('Filter by tag names (AND semantics — workflow must have all).'),
    sortBy: zod_1.default
        .enum(mcp_types_1.SEARCH_WORKFLOWS_SORT_BY_VALUES)
        .optional()
        .describe(`Sort order for results (default: ${DEFAULT_SORT_BY}). Use updatedAt:desc to find the most recently edited workflows first.`),
    folderId: api_types_1.folderIdSchema
        .refine((id) => id === n8n_workflow_1.PROJECT_ROOT || FOLDER_ID_PATTERN.test(id), {
        message: `Must be a folder id, or "${n8n_workflow_1.PROJECT_ROOT}" for the project root`,
    })
        .optional()
        .describe(`Filter by folder. Pass a parentFolderId from an earlier result to find a workflow's siblings, or — when search_folders is available — use it to resolve a folder name to an id first. Pass "${n8n_workflow_1.PROJECT_ROOT}" for workflows that sit at the project root rather than in a folder.`),
    includeSubfolders: zod_1.default
        .boolean()
        .optional()
        .describe(`Whether a folderId search also covers that folder's subfolders (default: true). Set false to match only workflows directly inside the folder. Ignored when folderId is "${n8n_workflow_1.PROJECT_ROOT}", which always matches the project root only.`),
};
const outputSchema = {
    data: zod_1.default
        .array(zod_1.default
        .object({
        id: zod_1.default.string().describe('The unique identifier of the workflow'),
        name: zod_1.default.string().nullable().describe('The name of the workflow'),
        description: zod_1.default.string().nullable().optional().describe('The description of the workflow'),
        active: zod_1.default.boolean().nullable().describe('Whether the workflow is active'),
        createdAt: zod_1.default
            .string()
            .nullable()
            .describe('The ISO timestamp when the workflow was created'),
        updatedAt: zod_1.default
            .string()
            .nullable()
            .describe('ISO timestamp the workflow definition was last saved. Use this to identify recently edited workflows.'),
        triggerCount: zod_1.default
            .number()
            .nullable()
            .describe('The number of triggers associated with the workflow'),
        availableInMCP: zod_1.default.boolean().describe('Whether the workflow is visible to MCP tools'),
        parentFolderId: zod_1.default
            .string()
            .nullable()
            .describe('The id of the folder holding the workflow, or null when it sits at the project root. Pass it back as folderId to find related workflows.'),
        tags: zod_1.default.array(schemas_1.tagSchema).describe('Tags assigned to the workflow'),
    })
        .passthrough())
        .describe('List of workflows matching the query'),
    count: zod_1.default.number().int().min(0).describe('Total number of workflows that match the filters'),
    error: zod_1.default
        .string()
        .optional()
        .describe('Error message explaining why the search failed. Present only on failure.'),
};
const createSearchWorkflowsTool = (user, workflowService, folderFinderService, telemetry) => {
    return {
        name: 'search_workflows',
        config: {
            description: 'Search for workflows with optional filters. Returns a preview of each workflow. Where workflows are organised into folders, narrow the search with folderId instead of scanning everything: reuse a parentFolderId from an earlier result, or resolve a folder name with search_folders when that tool is available.',
            inputSchema,
            outputSchema,
            annotations: {
                title: 'Search Workflows',
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        handler: async ({ limit = MAX_RESULTS, query, projectId, tags, sortBy, folderId, includeSubfolders, }) => {
            const parameters = { limit, query, projectId, tags, sortBy, folderId, includeSubfolders };
            const telemetryPayload = {
                user_id: user.id,
                tool_name: 'search_workflows',
                parameters,
            };
            try {
                const payload = await searchWorkflows(user, workflowService, folderFinderService, {
                    limit,
                    query,
                    projectId,
                    tags,
                    sortBy,
                    folderId,
                    includeSubfolders,
                });
                telemetryPayload.results = {
                    success: true,
                    data: {
                        count: payload.count,
                    },
                };
                telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                return {
                    structuredContent: payload,
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(payload),
                        },
                    ],
                };
            }
            catch (error) {
                telemetryPayload.results = {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                };
                telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                if (error instanceof folder_not_found_error_1.FolderNotFoundError) {
                    const output = {
                        data: [],
                        count: 0,
                        error: (0, folder_error_utils_1.describeFolderError)(error),
                    };
                    return {
                        structuredContent: output,
                        content: [{ type: 'text', text: JSON.stringify(output) }],
                        isError: true,
                    };
                }
                throw error;
            }
        },
    };
};
exports.createSearchWorkflowsTool = createSearchWorkflowsTool;
async function resolveFolderFilter(folderFinderService, folderId, includeSubfolders) {
    if (folderId === n8n_workflow_1.PROJECT_ROOT)
        return { parentFolderId: n8n_workflow_1.PROJECT_ROOT };
    const folderIds = await folderFinderService.findFolderFilterIdsWithoutAccessCheck(folderId, includeSubfolders);
    if (folderIds.length === 0)
        throw new folder_not_found_error_1.FolderNotFoundError(folderId);
    return { parentFolderIds: folderIds };
}
async function searchWorkflows(user, workflowService, folderFinderService, { limit = MAX_RESULTS, query, projectId, tags, sortBy = DEFAULT_SORT_BY, folderId, includeSubfolders = true, }) {
    const safeLimit = Math.min(Math.max(1, limit), MAX_RESULTS);
    const filterTags = tags && Array.from(new Set(tags.filter((tag) => tag.length > 0)));
    const folderFilter = folderId === undefined
        ? {}
        : await resolveFolderFilter(folderFinderService, folderId, includeSubfolders);
    const options = {
        take: safeLimit,
        sortBy,
        filter: {
            isArchived: false,
            ...(query ? { query } : {}),
            ...(projectId ? { projectId } : {}),
            ...(filterTags && filterTags.length > 0 ? { tags: filterTags } : {}),
            ...folderFilter,
        },
        select: {
            id: true,
            activeVersionId: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            triggerCount: true,
            settings: true,
            parentFolder: true,
            tags: true,
        },
    };
    const { workflows, count } = await workflowService.getMany(user, options);
    const formattedWorkflows = workflows.map((workflow) => {
        const { id, name, description, activeVersionId, createdAt, updatedAt, triggerCount, settings, parentFolder, tags: workflowTags, } = workflow;
        return {
            id,
            name,
            description,
            active: activeVersionId !== null,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
            triggerCount,
            availableInMCP: settings?.availableInMCP ?? false,
            parentFolderId: parentFolder?.id ?? null,
            tags: (0, schemas_1.toTagSummary)(workflowTags),
        };
    });
    return { data: formattedWorkflows, count };
}
//# sourceMappingURL=search-workflows.tool.js.map