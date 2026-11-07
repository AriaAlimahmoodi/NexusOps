"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCheckResult = buildCheckResult;
function buildCheckResult(args) {
    const { hasProblem, hadProblem, fingerprint, previousFingerprint, context } = args;
    if (!hasProblem) {
        if (!hadProblem)
            return {};
        return { auditEvents: [{ eventName: args.auditResolved, payload: {} }] };
    }
    const result = {
        warnings: [{ code: args.code, message: args.message, severity: args.severity, context }],
    };
    if (!hadProblem || fingerprint !== previousFingerprint) {
        result.auditEvents = [{ eventName: args.auditDetected, payload: context }];
    }
    return result;
}
//# sourceMappingURL=build-check-result.js.map