"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionMismatchCheck = void 0;
const decorators_1 = require("@n8n/decorators");
const build_check_result_1 = require("./build-check-result");
const CHECK_CODE = 'cluster.version-mismatch';
const AUDIT_DETECTED = 'n8n.audit.cluster.version-mismatch.detected';
const AUDIT_RESOLVED = 'n8n.audit.cluster.version-mismatch.resolved';
function computeFingerprint(instances) {
    const versions = [...new Set([...instances].map((i) => i.version))].sort();
    return { fingerprint: versions.join('|'), versions };
}
let VersionMismatchCheck = class VersionMismatchCheck {
    constructor() {
        this.checkDescription = {
            name: 'version-mismatch',
            displayName: 'Version mismatch',
        };
    }
    async run(context) {
        const current = computeFingerprint(context.currentState.values());
        const previous = computeFingerprint(context.previousState.values());
        const { versions } = current;
        return (0, build_check_result_1.buildCheckResult)({
            hasProblem: versions.length > 1,
            hadProblem: previous.versions.length > 1,
            fingerprint: current.fingerprint,
            previousFingerprint: previous.fingerprint,
            code: CHECK_CODE,
            severity: 'error',
            message: `Detected multiple n8n versions in the cluster: ${versions.join(', ')}`,
            context: { versions },
            auditDetected: AUDIT_DETECTED,
            auditResolved: AUDIT_RESOLVED,
        });
    }
};
exports.VersionMismatchCheck = VersionMismatchCheck;
exports.VersionMismatchCheck = VersionMismatchCheck = __decorate([
    (0, decorators_1.ClusterCheck)()
], VersionMismatchCheck);
//# sourceMappingURL=version-mismatch.check.js.map