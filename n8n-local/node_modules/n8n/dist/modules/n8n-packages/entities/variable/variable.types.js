"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.destinationKey = destinationKey;
exports.divergentOverwrites = divergentOverwrites;
exports.computeVariableLimitFailure = computeVariableLimitFailure;
function destinationKey(destination) {
    return destination.projectId
        ? `project:${destination.projectId}:${destination.name}`
        : `global:${destination.name}`;
}
function divergentOverwrites(overwrites) {
    const firstValueByRow = new Map();
    const divergent = new Set();
    for (const { variableId, value } of overwrites) {
        const seen = firstValueByRow.get(variableId);
        if (seen === undefined)
            firstValueByRow.set(variableId, value);
        else if (seen !== value)
            divergent.add(variableId);
    }
    return overwrites.filter(({ variableId }) => divergent.has(variableId));
}
function computeVariableLimitFailure(creations, quota) {
    if (quota === null || creations.length === 0)
        return undefined;
    if (creations.length <= quota.remaining)
        return undefined;
    return {
        limit: quota.limit,
        remaining: quota.remaining,
        requested: creations.length,
        names: [...new Set(creations.map((creation) => creation.name))].sort(),
    };
}
//# sourceMappingURL=variable.types.js.map