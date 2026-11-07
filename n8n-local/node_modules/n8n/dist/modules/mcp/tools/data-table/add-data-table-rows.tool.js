"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAddDataTableRowsTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const ADD_ROWS_MAX = 1000;
const addRowsInputSchema = {
    dataTableId: zod_1.default.string().describe('The ID of the data table to insert rows into'),
    projectId: schemas_1.dataTableProjectIdSchema,
    rows: zod_1.default
        .array(schemas_1.dataTableRowSchema)
        .min(1)
        .max(ADD_ROWS_MAX)
        .describe(`Array of row objects to insert. Each object maps column names to values. Maximum ${ADD_ROWS_MAX} rows per call.`),
};
const addRowsOutputSchema = {
    success: zod_1.default.boolean().describe('Whether the insert operation succeeded'),
    insertedCount: zod_1.default.number().int().min(0).describe('Number of rows successfully inserted'),
};
const createAddDataTableRowsTool = (user, dataTableOps, telemetry) => ({
    name: 'add_data_table_rows',
    config: {
        description: 'Insert rows into an existing data table. Each row is an object mapping column names to values. Use search_data_tables to find the data table ID first.',
        inputSchema: addRowsInputSchema,
        outputSchema: addRowsOutputSchema,
        annotations: {
            title: 'Add Data Table Rows',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ dataTableId, projectId, rows, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'add_data_table_rows',
            parameters: { dataTableId, projectId, rowCount: rows.length },
        };
        try {
            const result = await dataTableOps.insertRows(dataTableId, projectId, rows, 'count');
            const output = {
                success: true,
                insertedCount: result.insertedRows,
            };
            telemetryPayload.results = {
                success: true,
                data: { insertedCount: result.insertedRows },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (error) {
            return (0, tool_error_utils_1.trackAndReturnToolError)(telemetry, telemetryPayload, error, (message) => ({
                success: false,
                insertedCount: 0,
                error: message,
            }));
        }
    },
});
exports.createAddDataTableRowsTool = createAddDataTableRowsTool;
//# sourceMappingURL=add-data-table-rows.tool.js.map