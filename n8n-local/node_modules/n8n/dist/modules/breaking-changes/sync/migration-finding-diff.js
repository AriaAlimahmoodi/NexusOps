"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffMigrationFindings = diffMigrationFindings;
const hitKey = (ruleId, workflowId) => `${ruleId}\u0000${workflowId}`;
const RESOLVABLE_STATUSES = new Set(['open', 'notified', 'wont_fix']);
function diffMigrationFindings(input) {
    const { targetVersion, hits, existing, unknown = [] } = input;
    const batchWorkflowIds = new Set(input.workflowIds);
    const unknownKeys = new Set(unknown.map((pair) => hitKey(pair.ruleId, pair.workflowId)));
    const hitKeys = new Set();
    for (const hit of hits) {
        if (batchWorkflowIds.has(hit.workflowId))
            hitKeys.add(hitKey(hit.ruleId, hit.workflowId));
    }
    const diff = { toInsert: [], toMarkFixed: [], toReopen: [] };
    const seenKeys = new Set();
    for (const row of existing) {
        if (!batchWorkflowIds.has(row.workflowId))
            continue;
        const key = hitKey(row.ruleId, row.workflowId);
        seenKeys.add(key);
        if (unknownKeys.has(key))
            continue;
        const isHit = hitKeys.has(key);
        if (RESOLVABLE_STATUSES.has(row.status) && !isHit)
            diff.toMarkFixed.push(row.id);
        if (row.status === 'fixed' && isHit)
            diff.toReopen.push(row.id);
    }
    for (const hit of hits) {
        const key = hitKey(hit.ruleId, hit.workflowId);
        if (!hitKeys.has(key) || seenKeys.has(key) || unknownKeys.has(key))
            continue;
        seenKeys.add(key);
        diff.toInsert.push({ targetVersion, ruleId: hit.ruleId, workflowId: hit.workflowId });
    }
    return diff;
}
//# sourceMappingURL=migration-finding-diff.js.map