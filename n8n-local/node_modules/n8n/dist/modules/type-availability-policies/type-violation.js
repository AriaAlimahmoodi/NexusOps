"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREDENTIAL_TYPE_SUBJECT = exports.NODE_TYPE_SUBJECT = void 0;
exports.toTypeViolation = toTypeViolation;
exports.NODE_TYPE_SUBJECT = {
    kind: 'node-type-unavailable',
    subjectType: 'nodeType',
    label: 'Node type',
};
exports.CREDENTIAL_TYPE_SUBJECT = {
    kind: 'credential-type-unavailable',
    subjectType: 'credentialType',
    label: 'Credential type',
};
function toTypeViolation(checkId, subject, verdict, projectId) {
    const by = verdict.scope === 'instance' ? 'an instance policy' : 'a project policy';
    return {
        kind: subject.kind,
        checkId,
        message: `${subject.label} "${verdict.name}" is blocked by ${by}`,
        subject: verdict.name,
        subjectType: subject.subjectType,
        scope: verdict.scope,
        ...(verdict.matchedRuleId !== null && { matchedRuleId: verdict.matchedRuleId }),
        ...(projectId !== null && { projectId }),
        optInAvailable: projectId !== null && verdict.optInAvailable,
    };
}
//# sourceMappingURL=type-violation.js.map