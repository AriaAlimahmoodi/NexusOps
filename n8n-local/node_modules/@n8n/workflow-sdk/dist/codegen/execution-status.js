"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNodeExecutionStatus = buildNodeExecutionStatus;
exports.formatExecutionStatusJSDoc = formatExecutionStatusJSDoc;
function buildNodeExecutionStatus(data) {
    const statuses = new Map();
    if (!data?.runData)
        return statuses;
    for (const [nodeName, taskDataArray] of Object.entries(data.runData)) {
        for (const taskData of taskDataArray) {
            if (taskData.error) {
                const msg = taskData.error.message ?? 'Unknown error';
                const desc = taskData.error.description;
                const fullMsg = desc ? `${msg}: ${desc}` : msg;
                const truncated = fullMsg.length > 150 ? fullMsg.slice(0, 150) + '...' : fullMsg;
                statuses.set(nodeName, { status: 'error', errorMessage: truncated });
            }
            else {
                statuses.set(nodeName, { status: 'success' });
            }
            break;
        }
    }
    return statuses;
}
function formatExecutionStatusJSDoc(data) {
    if (!data)
        return '';
    const lines = [];
    if (data.lastNodeExecuted) {
        lines.push(`@lastExecuted "${data.lastNodeExecuted}"`);
    }
    const hasError = !!data.error || hasNodeErrors(data);
    lines.push(`@workflowExecutionStatus ${hasError ? 'error' : 'success'}`);
    return lines.join('\n');
}
function hasNodeErrors(data) {
    if (!data.runData)
        return false;
    return Object.values(data.runData).some((taskDataArray) => taskDataArray.some((td) => td.error));
}
//# sourceMappingURL=execution-status.js.map