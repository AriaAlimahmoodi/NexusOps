"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRenameDataTableTool = void 0;
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const schemas_1 = require("../schemas");
const tool_error_utils_1 = require("../tool-error.utils");
const inputSchema = {
    dataTableId: zod_1.default.string().describe('The ID of the data table to rename'),
    projectId: schemas_1.dataTableProjectIdSchema,
    name: zod_1.default.string().min(1).max(128).describe('The new name for the data table'),
};
const outputSchema = schemas_1.successMessageOutputSchema;
const createRenameDataTableTool = (user, dataTableOps, telemetry) => ({
    name: 'rename_data_table',
    config: {
        description: 'Rename an existing data table.',
        inputSchema,
        outputSchema,
        annotations: {
            title: 'Rename Data Table',
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    handler: async ({ dataTableId, projectId, name, }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: 'rename_data_table',
            parameters: { dataTableId, projectId },
        };
        try {
            await dataTableOps.updateDataTable(dataTableId, projectId, { name });
            const output = { success: true, message: `Data table renamed to '${name}'` };
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
exports.createRenameDataTableTool = createRenameDataTableTool;
//# sourceMappingURL=rename-data-table.tool.js.map