"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastCompletedPhase = getLastCompletedPhase;
exports.getPhaseEntry = getPhaseEntry;
exports.hasPhaseCompleted = hasPhaseCompleted;
exports.getBuilderOutput = getBuilderOutput;
exports.getPhaseMetadata = getPhaseMetadata;
exports.hasBuilderPhaseInLog = hasBuilderPhaseInLog;
exports.hasErrorInLog = hasErrorInLog;
exports.getErrorEntry = getErrorEntry;
exports.hasRecursionErrorsCleared = hasRecursionErrorsCleared;
exports.getNextPhaseFromLog = getNextPhaseFromLog;
exports.getCurrentTurnEntries = getCurrentTurnEntries;
exports.summarizeCoordinationLog = summarizeCoordinationLog;
function getLastCompletedPhase(log) {
    if (log.length === 0)
        return null;
    for (let i = log.length - 1; i >= 0; i--) {
        if (log[i].status === 'completed') {
            return log[i].phase;
        }
    }
    return null;
}
function getPhaseEntry(log, phase) {
    return log.findLast((entry) => entry.phase === phase && entry.status === 'completed') ?? null;
}
function hasPhaseCompleted(log, phase) {
    return log.some((entry) => entry.phase === phase && entry.status === 'completed');
}
function getBuilderOutput(log) {
    const entry = getPhaseEntry(log, 'builder');
    return entry?.output ?? null;
}
function getPhaseMetadata(log, phase) {
    const entry = getPhaseEntry(log, phase);
    if (!entry)
        return null;
    if (entry.metadata.phase === 'error')
        return null;
    return entry.metadata;
}
function hasBuilderPhaseInLog(log) {
    return log.some((entry) => entry.phase === 'builder' && entry.status === 'completed');
}
function hasErrorInLog(log) {
    return log.some((entry) => entry.status === 'error');
}
function getErrorEntry(log) {
    return log.find((entry) => entry.status === 'error') ?? null;
}
function hasRecursionErrorsCleared(log) {
    return log.some((entry) => entry.phase === 'state_management' &&
        entry.summary.includes('Cleared') &&
        entry.summary.includes('recursion'));
}
function getNextPhaseFromLog(log) {
    const hasErrors = hasErrorInLog(log);
    if (hasErrors) {
        if (!hasRecursionErrorsCleared(log)) {
            return 'responder';
        }
        const lastClearIndex = log.findLastIndex((entry) => entry.phase === 'state_management' &&
            entry.summary.includes('Cleared') &&
            entry.summary.includes('recursion'));
        const hasErrorsAfterClear = log
            .slice(lastClearIndex + 1)
            .some((entry) => entry.status === 'error');
        if (hasErrorsAfterClear) {
            return 'responder';
        }
    }
    const lastPhase = getLastCompletedPhase(log);
    if (lastPhase === 'discovery') {
        return 'builder';
    }
    if (lastPhase === 'builder') {
        return 'responder';
    }
    if (lastPhase === 'assistant') {
        return 'responder';
    }
    return 'responder';
}
function getCurrentTurnEntries(log) {
    const lastResponderIndex = log.findLastIndex((entry) => entry.phase === 'responder' && entry.status === 'completed');
    if (lastResponderIndex === -1)
        return log;
    return log.slice(lastResponderIndex + 1);
}
function summarizeCoordinationLog(log) {
    if (log.length === 0)
        return 'No phases completed';
    return log
        .filter((e) => e.status === 'completed')
        .map((e) => `${e.phase}: ${e.summary}`)
        .join(' → ');
}
//# sourceMappingURL=coordination-log.js.map