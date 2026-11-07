"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planLeaves = planLeaves;
exports.unfinishedPlanIds = unfinishedPlanIds;
function planLeaves(document) {
    return document.items.flatMap((item) => item.kind === 'group' && item.tasks.length > 0 ? item.tasks : [item]);
}
function unfinishedPlanIds(document) {
    return planLeaves(document)
        .filter((item) => item.status === 'pending' || item.status === 'in_progress')
        .map((item) => item.id);
}
//# sourceMappingURL=agent-plan-work-state.js.map