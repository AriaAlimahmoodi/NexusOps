"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRequirementUsage = addRequirementUsage;
exports.groupRequirementUsage = groupRequirementUsage;
function addRequirementUsage(usage, source) {
    const consumer = 'workflowId' in source
        ? { kind: 'workflow', id: source.workflowId }
        : { kind: 'agent', id: source.agentId };
    if (!usage.usedBy.some(({ kind, id }) => kind === consumer.kind && id === consumer.id)) {
        usage.usedBy.push(consumer);
    }
}
function groupRequirementUsage(requirements, keyOf) {
    const grouped = new Map();
    for (const requirement of requirements) {
        const key = keyOf(requirement);
        const usage = grouped.get(key) ?? { usedBy: [] };
        addRequirementUsage(usage, requirement);
        grouped.set(key, usage);
    }
    return grouped;
}
//# sourceMappingURL=requirement-source.js.map