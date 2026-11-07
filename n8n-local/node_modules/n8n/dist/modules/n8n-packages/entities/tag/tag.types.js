"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareTagsByName = void 0;
exports.droppedTagIds = droppedTagIds;
exports.contestedReconcileTargetFailures = contestedReconcileTargetFailures;
const compareTagsByName = (a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en');
exports.compareTagsByName = compareTagsByName;
function droppedTagIds(plan) {
    return new Set(plan.dropped.map(({ id }) => id));
}
function contestedReconcileTargetFailures(plans) {
    const reconcilesByKey = new Map();
    for (const tagPlan of plans) {
        for (const reconcile of tagPlan.reconciles) {
            reconcilesByKey.set(JSON.stringify([reconcile.id, reconcile.oldId]), reconcile);
        }
    }
    if (reconcilesByKey.size === 0)
        return [];
    const reconciles = [...reconcilesByKey.values()];
    const claimedTargetIds = new Set(plans.flatMap((tagPlan) => [
        ...tagPlan.matched.map(({ id }) => id),
        ...tagPlan.renames.map(({ id }) => id),
    ]));
    const oldIdCounts = new Map();
    for (const { oldId } of reconciles) {
        oldIdCounts.set(oldId, (oldIdCounts.get(oldId) ?? 0) + 1);
    }
    return reconciles
        .filter(({ oldId }) => claimedTargetIds.has(oldId) || (oldIdCounts.get(oldId) ?? 0) > 1)
        .map(({ id, name, oldId }) => ({
        kind: 'name-collision',
        sourceId: id,
        name,
        existingTagId: oldId,
    }));
}
//# sourceMappingURL=tag.types.js.map