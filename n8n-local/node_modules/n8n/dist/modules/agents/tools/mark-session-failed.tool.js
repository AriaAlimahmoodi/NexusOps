"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARK_SESSION_FAILED_TOOL_NAME = void 0;
exports.createMarkSessionFailedTool = createMarkSessionFailedTool;
const tool_1 = require("@n8n/agents/tool");
const zod_1 = require("zod");
exports.MARK_SESSION_FAILED_TOOL_NAME = 'mark_session_failed';
const DESCRIPTION = 'Mark this session as failed when you cannot complete the task. ' +
    'Call it after tool errors you cannot fix. ' +
    'Do not call it when you have fixed the tool error. ' +
    'Pass a short reason.';
function createMarkSessionFailedTool() {
    return (new tool_1.Tool(exports.MARK_SESSION_FAILED_TOOL_NAME)
        .description(DESCRIPTION)
        .input(zod_1.z.object({ reason: zod_1.z.string().trim().min(1).max(400) }))
        .handler(async () => ({ marked: true })));
}
//# sourceMappingURL=mark-session-failed.tool.js.map