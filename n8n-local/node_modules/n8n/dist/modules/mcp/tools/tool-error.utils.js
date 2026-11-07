"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackAndReturnToolError = trackAndReturnToolError;
exports.trackAndRethrowToolError = trackAndRethrowToolError;
const get_error_message_1 = require("@n8n/utils/errors/get-error-message");
const mcp_constants_1 = require("../mcp.constants");
function trackAndReturnToolError(telemetry, telemetryPayload, error, formatOutput = (message) => ({ error: message })) {
    const errorMessage = (0, get_error_message_1.getErrorMessage)(error);
    telemetryPayload.results = { success: false, error: errorMessage };
    telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
    const output = formatOutput(errorMessage);
    return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
        isError: true,
    };
}
function trackAndRethrowToolError(telemetry, telemetryPayload, error) {
    telemetryPayload.results = {
        success: false,
        error: (0, get_error_message_1.getErrorMessage)(error),
    };
    telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
    throw error;
}
//# sourceMappingURL=tool-error.utils.js.map