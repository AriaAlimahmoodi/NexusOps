"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_DISCOVERY_DELAY_MS = void 0;
exports.evaluateMcpDiscoveryEligibility = evaluateMcpDiscoveryEligibility;
exports.MCP_DISCOVERY_DELAY_MS = 30 * 60 * 1000;
function evaluateMcpDiscoveryEligibility(input) {
    const { now, isTrial, firstLoginAt, assistantMutationAt, pickedClaude } = input;
    if (pickedClaude === false)
        return { status: 'excluded', reason: 'client' };
    if (isTrial === undefined)
        return { status: 'unknown' };
    if (!isTrial)
        return { status: 'excluded', reason: 'trial' };
    if (firstLoginAt === undefined ||
        ![now, firstLoginAt].every(Number.isFinite) ||
        firstLoginAt > now ||
        assistantMutationAt === undefined ||
        (assistantMutationAt !== null && !Number.isFinite(assistantMutationAt))) {
        return { status: 'unknown' };
    }
    const eligibleAt = firstLoginAt + exports.MCP_DISCOVERY_DELAY_MS;
    if (assistantMutationAt !== null && assistantMutationAt <= eligibleAt) {
        return { status: 'excluded', reason: 'assistant' };
    }
    if (now < eligibleAt)
        return { status: 'waiting', eligibleAt };
    if (pickedClaude === undefined)
        return { status: 'unknown' };
    return { status: 'eligible', eligibleAt };
}
//# sourceMappingURL=eligibility.js.map