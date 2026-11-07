"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRenameDataTableColumnTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const inputSchema = {
    dataTableId: zod_1.default.string().describe('The ID of the data table containing the column'),
    projectId: schemas_1.dataTableProjectIdSchema,
    columnId: zod_1.default.string().describe('The ID of the column to rename'),
    name: schemas_1.columnNameSchema.describe('The new column name'),
};
const outputSchema = {
    ...schemas_1.successMessageOutputSchema,
    column: schemas_1.dataTableColumnSchema.omit({ index: true }).describe('The renamed column'),
};
const createRenameDataTableColumnTool = (user, dataTableOps, telemetry) => ({
    name: 'rename_data_table_column',
    config: {
        description: 'Rename a column in a data table.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Rename Data Table Column',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ dataTableId, projectId, columnId, name, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'rename_data_table_column',
            parameters: { dataTableId, projectId, columnId },
        };
        try {
            const renamedColumn = await dataTableOps.renameColumn(dataTableId, projectId, columnId, {
                name,
            });
            const output = {
                success: true,
                message: `Column renamed to '${name}'`,
                column: { id: renamedColumn.id, name: renamedColumn.name, type: renamedColumn.type },
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
exports.createRenameDataTableColumnTool = createRenameDataTableColumnTool;
//# sourceMappingURL=rename-data-table-column.tool.js.map