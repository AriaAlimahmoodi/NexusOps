"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFailHandler = void 0;
exports.describeFolderError = describeFolderError;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const folder_not_found_error_1 = require("../../../errors/folder-not-found.error");
const mcp_constants_1 = require("../mcp.constants");
function describeFolderError(error) {
    if (error instanceof folder_not_found_error_1.FolderNotFoundError) {
        return `${error.message}. Use search_folders to look up a valid folder id.`;
    }
    return (0, ensure_error_1.ensureError)(error).message;
}
const createFailHandler = (telemetry, telemetryPayload) => (error) => {
    telemetryPayload.results = { success: false, error };
    telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
    const output = { error };
    return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
        isError: true,
    };
};
exports.createFailHandler = createFailHandler;
//# sourceMappingURL=folder-error.utils.js.map