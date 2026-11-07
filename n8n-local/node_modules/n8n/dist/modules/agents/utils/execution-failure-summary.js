"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeExecutionFailureSummary = computeExecutionFailureSummary;
const is_record_1 = require("@n8n/utils/is-record");
const MAX_FAILURE_MESSAGE_LENGTH = 400;
function failureMessage(output) {
    if (!(0, is_record_1.isRecord)(output) || typeof output.error !== 'string')
        return null;
    const message = output.error.trim();
    return message ? message.slice(0, MAX_FAILURE_MESSAGE_LENGTH) : null;
}
function isDeclinedToolOutput(output) {
    return (0, is_record_1.isRecord)(output) && output.declined === true;
}
function isSoftFailure(event) {
    if (!(0, is_record_1.isRecord)(event.output))
        return false;
    return ((event.kind === 'workflow' && event.output.status === 'error') ||
        (event.name === 'delegate_subagent' && event.output.status === 'failed'));
}
function computeExecutionFailureSummary({ timeline, status, error, stoppedAt, }) {
    let count = 0;
    let latest = null;
    const addFailure = (failure) => {
        count++;
        if (latest === null || failure.occurredAt >= latest.occurredAt)
            latest = failure;
    };
    for (const event of timeline) {
        if (event.type !== 'tool-call' ||
            event.endTime === 0 ||
            isDeclinedToolOutput(event.output) ||
            (event.success && !isSoftFailure(event))) {
            continue;
        }
        addFailure({
            kind: event.kind,
            name: event.nodeDisplayName ?? event.workflowName ?? event.name,
            message: failureMessage(event.output),
            occurredAt: event.endTime,
        });
    }
    if (status === 'error' || status === 'interrupted') {
        const message = error?.trim();
        addFailure({
            kind: 'execution',
            name: null,
            message: message ? message.slice(0, MAX_FAILURE_MESSAGE_LENGTH) : null,
            occurredAt: stoppedAt,
        });
    }
    return latest ? { count, latest } : null;
}
//# sourceMappingURL=execution-failure-summary.js.map