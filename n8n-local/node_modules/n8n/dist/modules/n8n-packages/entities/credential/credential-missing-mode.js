"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canStubNotFoundFailure = canStubNotFoundFailure;
exports.credentialBlockingFailures = credentialBlockingFailures;
exports.credentialsToStub = credentialsToStub;
exports.credentialMissingModeCreates = credentialMissingModeCreates;
exports.credentialMissingModeUsesPackageData = credentialMissingModeUsesPackageData;
exports.workflowsBlockedFromPublish = workflowsBlockedFromPublish;
const requirement_consumers_1 = require("../../spec/requirement-consumers");
function canStubNotFoundFailure(failure) {
    return failure.kind === 'not_found' && failure.targetId === undefined;
}
const rescueStubbable = (resolution) => resolution.failures.filter((failure) => !canStubNotFoundFailure(failure));
const BLOCKING_FAILURES = {
    'must-preexist': (resolution) => resolution.failures,
    'create-stub': rescueStubbable,
    'create-with-values': rescueStubbable,
};
function credentialBlockingFailures(mode, resolution) {
    return BLOCKING_FAILURES[mode](resolution);
}
function credentialsToStub(mode, resolution) {
    if (!credentialMissingModeCreates(mode))
        return [];
    return [
        ...new Map(resolution.failures
            .filter((failure) => canStubNotFoundFailure(failure))
            .map((failure) => [failure.sourceId, failure])).values(),
    ];
}
function credentialMissingModeCreates(mode) {
    return mode === 'create-stub' || mode === 'create-with-values';
}
function credentialMissingModeUsesPackageData(mode) {
    return mode === 'create-with-values';
}
function workflowsBlockedFromPublish(requirements, sourceIds) {
    const blocked = new Set();
    for (const requirement of requirements ?? []) {
        if (!sourceIds.has(requirement.id))
            continue;
        for (const sourceWorkflowId of (0, requirement_consumers_1.getWorkflowConsumerIds)(requirement)) {
            blocked.add(sourceWorkflowId);
        }
    }
    return blocked;
}
//# sourceMappingURL=credential-missing-mode.js.map