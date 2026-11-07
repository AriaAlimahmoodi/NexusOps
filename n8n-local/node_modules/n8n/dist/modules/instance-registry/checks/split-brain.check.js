"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitBrainCheck = void 0;
const decorators_1 = require("@n8n/decorators");
const build_check_result_1 = require("./build-check-result");
const CHECK_CODE = 'cluster.split-brain';
const AUDIT_DETECTED = 'n8n.audit.cluster.split-brain.detected';
const AUDIT_RESOLVED = 'n8n.audit.cluster.split-brain.resolved';
function computeFingerprint(instances) {
    const leaders = [...instances]
        .filter((i) => i.instanceRole === 'leader')
        .map((i) => ({
        instanceKey: i.instanceKey,
        hostId: i.hostId,
        instanceType: i.instanceType,
    }))
        .sort((a, b) => a.instanceKey.localeCompare(b.instanceKey));
    return {
        fingerprint: leaders.map((l) => l.instanceKey).join('|'),
        leaders,
    };
}
let SplitBrainCheck = class SplitBrainCheck {
    constructor() {
        this.checkDescription = {
            name: 'split-brain',
            displayName: 'Split-brain',
        };
    }
    async run(context) {
        const current = computeFingerprint(context.currentState.values());
        const previous = computeFingerprint(context.previousState.values());
        const leaderKeys = current.leaders.map((l) => l.instanceKey);
        return (0, build_check_result_1.buildCheckResult)({
            hasProblem: current.leaders.length > 1,
            hadProblem: previous.leaders.length > 1,
            fingerprint: current.fingerprint,
            previousFingerprint: previous.fingerprint,
            code: CHECK_CODE,
            severity: 'error',
            message: `Detected ${current.leaders.length} instances claiming leader role: ${leaderKeys.join(', ')}`,
            context: { leaders: current.leaders },
            auditDetected: AUDIT_DETECTED,
            auditResolved: AUDIT_RESOLVED,
        });
    }
};
exports.SplitBrainCheck = SplitBrainCheck;
exports.SplitBrainCheck = SplitBrainCheck = __decorate([
    (0, decorators_1.ClusterCheck)()
], SplitBrainCheck);
//# sourceMappingURL=split-brain.check.js.map