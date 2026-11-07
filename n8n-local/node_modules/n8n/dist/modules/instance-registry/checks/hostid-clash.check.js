"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostIdClashCheck = void 0;
const decorators_1 = require("@n8n/decorators");
const build_check_result_1 = require("./build-check-result");
const CHECK_CODE = 'cluster.hostid-clash';
const AUDIT_DETECTED = 'n8n.audit.cluster.hostid-clash.detected';
const AUDIT_RESOLVED = 'n8n.audit.cluster.hostid-clash.resolved';
function computeFingerprint(instances) {
    const byHost = new Map();
    for (const instance of instances) {
        const keys = byHost.get(instance.hostId) ?? [];
        keys.push(instance.instanceKey);
        byHost.set(instance.hostId, keys);
    }
    const clashing = Array.from(byHost.entries())
        .filter(([, keys]) => keys.length > 1)
        .map(([hostId, keys]) => ({ hostId, instanceKeys: [...keys].sort() }))
        .sort((a, b) => a.hostId.localeCompare(b.hostId));
    return {
        fingerprint: clashing.map((c) => c.hostId).join('|'),
        clashing,
    };
}
let HostIdClashCheck = class HostIdClashCheck {
    constructor() {
        this.checkDescription = {
            name: 'hostid-clash',
            displayName: 'Host ID clash',
        };
    }
    async run(context) {
        const current = computeFingerprint(context.currentState.values());
        const previous = computeFingerprint(context.previousState.values());
        const hostIds = current.clashing.map((c) => c.hostId);
        return (0, build_check_result_1.buildCheckResult)({
            hasProblem: current.clashing.length > 0,
            hadProblem: previous.clashing.length > 0,
            fingerprint: current.fingerprint,
            previousFingerprint: previous.fingerprint,
            code: CHECK_CODE,
            severity: 'warning',
            message: `Detected multiple instances sharing the same hostId: ${hostIds.join(', ')}`,
            context: { clashing: current.clashing },
            auditDetected: AUDIT_DETECTED,
            auditResolved: AUDIT_RESOLVED,
        });
    }
};
exports.HostIdClashCheck = HostIdClashCheck;
exports.HostIdClashCheck = HostIdClashCheck = __decorate([
    (0, decorators_1.ClusterCheck)()
], HostIdClashCheck);
//# sourceMappingURL=hostid-clash.check.js.map