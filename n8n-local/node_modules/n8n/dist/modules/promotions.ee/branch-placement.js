"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnder = void 0;
exports.containerMoves = containerMoves;
exports.remapPath = remapPath;
exports.staleWorkflowTargets = staleWorkflowTargets;
const CONTAINER_KINDS = ['projects', 'folders'];
const isUnder = (target, prefix) => target.startsWith(`${prefix}/`);
exports.isUnder = isUnder;
function containerMoves(existing, staging) {
    const moves = [];
    for (const kind of CONTAINER_KINDS) {
        const onBranch = new Map((existing[kind] ?? []).map((e) => [e.id, e.target]));
        for (const entry of staging[kind] ?? []) {
            const from = onBranch.get(entry.id);
            if (from === undefined || from === entry.target)
                continue;
            moves.push({ kind, from, to: entry.target });
        }
    }
    return moves.sort((a, b) => b.from.length - a.from.length);
}
function remapPath(target, moves) {
    let move;
    for (const m of moves) {
        if (target !== m.from && !(0, exports.isUnder)(target, m.from))
            continue;
        if (move === undefined || m.from.length > move.from.length)
            move = m;
    }
    return move ? `${move.to}${target.slice(move.from.length)}` : target;
}
function staleWorkflowTargets(existing, staging, deletedWorkflowIds) {
    const stale = new Set();
    const selected = new Set((staging.workflows ?? []).map((workflow) => workflow.id));
    for (const workflow of existing.workflows ?? []) {
        if (deletedWorkflowIds.has(workflow.id) || selected.has(workflow.id)) {
            stale.add(workflow.target);
        }
    }
    return [...stale];
}
//# sourceMappingURL=branch-placement.js.map