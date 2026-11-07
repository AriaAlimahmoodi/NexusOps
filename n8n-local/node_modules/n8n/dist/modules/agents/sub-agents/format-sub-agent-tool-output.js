"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSubAgentToolOutput = formatSubAgentToolOutput;
const agents_1 = require("@n8n/agents");
function formatSubAgentToolOutput(result) {
    const output = (0, agents_1.generateResultToDelegateSubAgentOutput)(result.taskPath, result.result, result.threadId);
    return {
        ...output,
        ...(output.status === 'suspended' && result.resumeContext !== undefined
            ? { resumeContext: result.resumeContext }
            : {}),
    };
}
//# sourceMappingURL=format-sub-agent-tool-output.js.map