"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetDataTableRowsTool = void 0;
const api_types_1 = require("@n8n/api-types");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const GET_ROWS_MAX = 100;
const filterSchema = zod_1.default
    .object({
    type: api_types_1.dataTableFilterTypeSchema
        .default('and')
        .describe('How to combine the filters: all must match (and) or any may match (or)'),
    filters: zod_1.default
        .array(zod_1.default.object({
        columnName: api_types_1.dataTableColumnNameSchema.describe("Column to filter on. System columns 'id', 'createdAt' and 'updatedAt' are also allowed"),
        condition: api_types_1.FilterConditionSchema.default('eq').describe("Comparison operator. 'like' (case-sensitive) and 'ilike' (case-insensitive) match substrings; include % wildcards for custom patterns. 'neq' also matches rows where the column is null"),
        value: zod_1.default
            .union([zod_1.default.string(), zod_1.default.number(), zod_1.default.boolean(), zod_1.default.null()])
            .describe('Value to compare against. For date columns, pass an ISO 8601 string. Pass null with eq/neq to match rows where the column is null / not null'),
    }))
        .min(1),
})
    .optional()
    .describe('Filter conditions to select rows. Omit to return all rows');
const sortBySchema = zod_1.default
    .string()
    .regex(/^[^:]+:(asc|desc)$/i, 'Expected format <columnName>:<asc|desc>')
    .refine((value) => api_types_1.dataTableColumnNameSchema.safeParse(value.split(':')[0]).success, {
    message: 'Invalid sort column name',
})
    .optional()
    .describe("Sort order as '<columnName>:<asc|desc>', e.g. 'createdAt:desc'");
const getRowsInputSchema = {
    dataTableId: zod_1.default.string().describe('The ID of the data table to read rows from'),
    projectId: schemas_1.dataTableProjectIdSchema,
    filter: filterSchema,
    sortBy: sortBySchema,
    limit: (0, schemas_1.createLimitSchema)(GET_ROWS_MAX),
    skip: zod_1.default
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Number of rows to skip, for paginating through large result sets'),
};
const getRowsOutputSchema = {
    rows: zod_1.default
        .array(schemas_1.dataTableRowSchema)
        .describe("Matching rows, mapping column names to values. Includes the system columns 'id', 'createdAt' and 'updatedAt'; dates are ISO 8601 strings"),
    count: zod_1.default
        .number()
        .int()
        .min(0)
        .describe('Total number of rows matching the filter, ignoring limit and skip'),
    error: zod_1.default.string().optional().describe('Error message if the read failed'),
};
const toSortByTuple = (sortBy) => {
    const [column, direction] = sortBy.split(':');
    return [column, direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'];
};
const serializeRow = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString() : value,
]));
const createGetDataTableRowsTool = (user, dataTableOps, telemetry) => ({
    name: 'get_data_table_rows',
    config: {
        description: 'Read rows from a data table, with optional filtering, sorting and pagination. Use search_data_tables to find the data table ID and its columns first.',
        inputSchema: getRowsInputSchema,
        outputSchema: getRowsOutputSchema,
        annotations: {
            title: 'Get Data Table Rows',
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ dataTableId, projectId, filter, sortBy, limit = GET_ROWS_MAX, skip }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'get_data_table_rows',
            parameters: {
                dataTableId,
                projectId,
                filterCount: filter?.filters.length,
                sortBy,
                limit,
                skip,
            },
        };
        try {
            const result = await dataTableOps.getManyRowsAndCount(dataTableId, projectId, {
                filter,
                sortBy: sortBy ? toSortByTuple(sortBy) : undefined,
                take: limit,
                skip,
            });
            const output = {
                rows: result.data.map(serializeRow),
                count: result.count,
            };
            telemetryPayload.results = {
                success: true,
                data: { count: result.count, returned: output.rows.length },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (error) {
            return (0, tool_error_utils_1.trackAndReturnToolError)(telemetry, telemetryPayload, error, (message) => ({
                rows: [],
                count: 0,
                error: message,
            }));
        }
    },
});
exports.createGetDataTableRowsTool = createGetDataTableRowsTool;
//# sourceMappingURL=get-data-table-rows.tool.js.map