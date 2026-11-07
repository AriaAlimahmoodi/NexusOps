"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCreateDataTableTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const columnSchema = zod_1.default.object({
    name: schemas_1.columnNameSchema,
    type: schemas_1.dataTableColumnTypeSchema,
});
const createInputSchema = {
    projectId: zod_1.default.string().describe('The project ID where the data table will be created'),
    name: zod_1.default
        .string()
        .min(1)
        .max(128)
        .describe('The name of the data table (must be unique within the project)'),
    columns: zod_1.default
        .array(columnSchema)
        .min(1)
        .describe('The columns to create in the data table. At least one column is required.'),
};
const createOutputSchema = {
    id: zod_1.default.string().describe('The unique identifier of the created data table'),
    name: zod_1.default.string().describe('The name of the created data table'),
    projectId: zod_1.default.string().describe('The project ID of the created data table'),
};
const createCreateDataTableTool = (user, dataTableOps, telemetry) => ({
    name: 'create_data_table',
    config: {
        description: 'Create a new data table with the specified columns. Use search_projects to find a project ID first.',
        inputSchema: createInputSchema,
        outputSchema: createOutputSchema,
        annotations: {
            title: 'Create Data Table',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ projectId, name, columns, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'create_data_table',
            parameters: { projectId, name, columnCount: columns.length },
        };
        try {
            const result = await dataTableOps.createDataTable(projectId, {
                name,
                columns: columns.map((col) => ({
                    name: col.name,
                    type: col.type,
                })),
            });
            await dataTableOps.getColumns(result.id, projectId);
            const output = {
                id: result.id,
                name: result.name,
                projectId: result.projectId,
            };
            telemetryPayload.results = {
                success: true,
                data: { dataTableId: result.id },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (error) {
            return (0, tool_error_utils_1.trackAndReturnToolError)(telemetry, telemetryPayload, error);
        }
    },
});
exports.createCreateDataTableTool = createCreateDataTableTool;
//# sourceMappingURL=create-data-table.tool.js.map