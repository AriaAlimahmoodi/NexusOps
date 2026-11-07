"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSearchDataTablesTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const SEARCH_MAX_RESULTS = 100;
const searchInputSchema = {
    query: zod_1.default
        .string()
        .optional()
        .describe('Filter data tables by name (case-insensitive partial match)'),
    projectId: zod_1.default.string().optional().describe('Filter by project ID'),
    limit: (0, schemas_1.createLimitSchema)(SEARCH_MAX_RESULTS),
};
const searchOutputSchema = {
    data: zod_1.default.array(schemas_1.dataTableSchema).describe('List of data tables matching the query'),
    count: zod_1.default.number().int().min(0).describe('Total number of matching data tables'),
};
const createSearchDataTablesTool = (user, dataTableOps, telemetry) => ({
    name: 'search_data_tables',
    config: {
        description: 'Search for data tables accessible to the current user. Use this to find a data table ID before modifying or adding data to it.',
        inputSchema: searchInputSchema,
        outputSchema: searchOutputSchema,
        annotations: {
            title: 'Search Data Tables',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ query, projectId, limit = SEARCH_MAX_RESULTS, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'search_data_tables',
            parameters: { query, projectId, limit },
        };
        try {
            const safeLimit = Math.min(Math.max(1, limit), SEARCH_MAX_RESULTS);
            const result = await dataTableOps.getManyAndCount({
                take: safeLimit,
                filter: {
                    ...(query ? { name: query } : {}),
                    ...(projectId ? { projectId } : {}),
                },
            });
            const data = result.data.map((table) => ({
                id: table.id,
                name: table.name,
                projectId: table.projectId,
                createdAt: table.createdAt.toISOString(),
                updatedAt: table.updatedAt.toISOString(),
                columns: (table.columns ?? []).map((col) => ({
                    id: col.id,
                    name: col.name,
                    type: col.type,
                    index: col.index,
                })),
            }));
            telemetryPayload.results = {
                success: true,
                data: { count: result.count },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = { data, count: result.count };
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
exports.createSearchDataTablesTool = createSearchDataTablesTool;
//# sourceMappingURL=search-data-tables.tool.js.map