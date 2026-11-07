"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNCONFIGURED_VERSION = void 0;
exports.unconfiguredScope = unconfiguredScope;
exports.toEffectivePolicy = toEffectivePolicy;
const policy_evaluator_1 = require("./policy-evaluator");
exports.UNCONFIGURED_VERSION = 0;
function unconfiguredScope(kind, projectId) {
    return {
        scopeId: null,
        kind,
        projectId,
        defaultAction: 'allow',
        version: exports.UNCONFIGURED_VERSION,
        rules: [],
        attachments: [],
    };
}
function flattenRules(attachments) {
    return (0, policy_evaluator_1.orderedAttachments)(attachments).flatMap((attachment) => [...attachment.rules]);
}
function toEffectivePolicy(scope, attachments) {
    return {
        scopeId: scope.id,
        kind: scope.kind,
        projectId: scope.projectId,
        defaultAction: scope.defaultAction,
        version: scope.version,
        rules: flattenRules(attachments),
        attachments,
    };
}
//# sourceMappingURL=effective-policy.js.map