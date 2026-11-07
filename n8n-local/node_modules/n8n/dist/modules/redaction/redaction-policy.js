"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDACTION_FLOOR_VIOLATION_MESSAGE = void 0;
exports.policyMeetsFloor = policyMeetsFloor;
exports.policyForFloor = policyForFloor;
const POLICY_SCOPE = {
    none: { production: false, manual: false },
    'manual-only': { production: false, manual: true },
    'non-manual': { production: true, manual: false },
    all: { production: true, manual: true },
};
const FLOOR_REQUIREMENTS = {
    off: { production: false, manual: false },
    production: { production: true, manual: false },
    all: { production: true, manual: true },
};
const FLOOR_SEED_POLICY = {
    off: undefined,
    production: 'non-manual',
    all: 'all',
};
exports.REDACTION_FLOOR_VIOLATION_MESSAGE = 'Workflow redaction policy cannot be weaker than the instance floor.';
function policyMeetsFloor(policy, floor) {
    const required = FLOOR_REQUIREMENTS[floor];
    const scope = POLICY_SCOPE[policy];
    return (!required.production || scope.production) && (!required.manual || scope.manual);
}
function policyForFloor(floor) {
    return FLOOR_SEED_POLICY[floor];
}
//# sourceMappingURL=redaction-policy.js.map