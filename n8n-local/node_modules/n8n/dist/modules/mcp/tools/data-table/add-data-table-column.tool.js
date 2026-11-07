"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAddDataTableColumnTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const inputSchema = {
    dataTableId: zod_1.default.string().describe('The ID of the data table to add a column to'),
    projectId: schemas_1.dataTableProjectIdSchema,
    name: schemas_1.columnNameSchema,
    type: schemas_1.dataTableColumnTypeSchema.describe('The data type of the new column'),
};
const outputSchema = {
    success: zod_1.default.boolean().describe('Whether the operation succeeded'),
    message: zod_1.default.string().describe('Description of the result'),
    column: schemas_1.dataTableColumnSchema.omit({ index: true }).describe('The created column'),
};
const createAddDataTableColumnTool = (user, dataTableOps, telemetry) => ({
    name: 'add_data_table_column',
    config: {
        description: 'Add a new column to an existing data table.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Add Data Table Column',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ dataTableId, projectId, name, type, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'add_data_table_column',
            parameters: { dataTableId, projectId },
        };
        try {
            const column = await dataTableOps.addColumn(dataTableId, projectId, { name, type });
            const output = {
                success: true,
                message: `Column '${name}' added with type '${type}'`,
                column: { id: column.id, name: column.name, type: column.type },
            };
            telemetryPayload.results = { success: true };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output,
            };
        }
        catch (error) {
            return (0, tool_error_utils_1.trackAndReturnToolError)(telemetry, telemetryPayload, error, (message) => ({
                success: false,
                message,
            }));
        }
    },
});
exports.createAddDataTableColumnTool = createAddDataTableColumnTool;
//# sourceMappingURL=add-data-table-column.tool.js.map