"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_ITERATIONS_STOPPED_MESSAGE = void 0;
exports.applyFatalSessionOutcome = applyFatalSessionOutcome;
exports.isFatalSessionOutcomeError = isFatalSessionOutcomeError;
const is_record_1 = require("@n8n/utils/is-record");
const mark_session_failed_tool_1 = require("../tools/mark-session-failed.tool");
exports.MAX_ITERATIONS_STOPPED_MESSAGE = 'The agent has reached the maximum number of iterations and has stopped.';
const MAX_REASON_LENGTH = 400;
function markedSessionFailureReason(timeline) {
    for (let index = timeline.length - 1; index >= 0; index--) {
        const event = timeline[index];
        if (event?.type !== 'tool-call' ||
            event.name !== mark_session_failed_tool_1.MARK_SESSION_FAILED_TOOL_NAME ||
            !event.success) {
            continue;
        }
        if (!(0, is_record_1.isRecord)(event.input) || typeof event.input.reason !== 'string')
            continue;
        const reason = event.input.reason.trim().slice(0, MAX_REASON_LENGTH);
        if (reason.length > 0)
            return reason;
    }
    return null;
}
function applyFatalSessionOutcome(record) {
    if (record.error !== null)
        return record;
    const reason = markedSessionFailureReason(record.timeline);
    if (reason !== null)
        return { ...record, error: reason };
    if (record.finishReason === 'max-iterations') {
        return { ...record, error: exports.MAX_ITERATIONS_STOPPED_MESSAGE };
    }
    return record;
}
function isFatalSessionOutcomeError(error, timeline) {
    return (error === exports.MAX_ITERATIONS_STOPPED_MESSAGE || error === markedSessionFailureReason(timeline ?? []));
}
//# sourceMappingURL=fatal-session-outcome.js.map