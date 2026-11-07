"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeleteDataTableColumnTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const inputSchema = {
    dataTableId: zod_1.default.string().describe('The ID of the data table containing the column'),
    projectId: schemas_1.dataTableProjectIdSchema,
    columnId: zod_1.default.string().describe('The ID of the column to delete'),
};
const outputSchema = schemas_1.successMessageOutputSchema;
const createDeleteDataTableColumnTool = (user, dataTableOps, telemetry) => ({
    name: 'delete_data_table_column',
    config: {
        description: 'Delete a column from a data table. This permanently removes the column and all its data.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Delete Data Table Column',
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ dataTableId, projectId, columnId, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'delete_data_table_column',
            parameters: { dataTableId, projectId, columnId },
        };
        try {
            await dataTableOps.deleteColumn(dataTableId, projectId, columnId);
            const output = { success: true, message: `Column '${columnId}' deleted` };
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
exports.createDeleteDataTableColumnTool = createDeleteDataTableColumnTool;
//# sourceMappingURL=delete-data-table-column.tool.js.map