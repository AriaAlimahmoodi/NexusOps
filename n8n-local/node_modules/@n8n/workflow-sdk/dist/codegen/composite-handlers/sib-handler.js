"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSplitInBatchesComposite = buildSplitInBatchesComposite;
const build_utils_1 = require("./build-utils");
function buildFromNodeSimple(nodeName, ctx) {
    const node = ctx.graph.nodes.get(nodeName);
    if (!node) {
        return (0, build_utils_1.createVarRef)(nodeName);
    }
    if (ctx.visited.has(nodeName)) {
        ctx.variables.set(nodeName, node);
        return (0, build_utils_1.createVarRef)(nodeName);
    }
    ctx.visited.add(nodeName);
    if ((0, build_utils_1.shouldBeVariable)(node)) {
        ctx.variables.set(nodeName, node);
    }
    const outputs = node.outputs.get('output') ?? node.outputs.get('output0') ?? [];
    if (outputs.length === 1) {
        const nextTarget = outputs[0].target;
        const nextComposite = buildFromNodeSimple(nextTarget, ctx);
        return {
            kind: 'chain',
            nodes: [(0, build_utils_1.createLeaf)(node), nextComposite],
        };
    }
    return (0, build_utils_1.createLeaf)(node);
}
function buildBranchTargets(targets, ctx, _sourceNodeName, _sourceOutputIndex) {
    if (targets.length === 0)
        return null;
    if (targets.length === 1) {
        return buildFromNodeSimple(targets[0].target, ctx);
    }
    const branches = [];
    for (const target of targets) {
        branches.push(buildFromNodeSimple(target.target, ctx));
    }
    return branches;
}
function buildSplitInBatchesComposite(node, ctx) {
    const doneTargets = node.outputs.get('done') ?? [];
    const loopTargets = node.outputs.get('loop') ?? [];
    const branchCtx = {
        ...ctx,
        isBranchContext: true,
    };
    const doneChain = buildBranchTargets(doneTargets, branchCtx, node.name, 0);
    const loopChain = buildBranchTargets(loopTargets, branchCtx, node.name, 1);
    return {
        kind: 'splitInBatches',
        sibNode: node,
        doneChain,
        loopChain,
    };
}
//# sourceMappingURL=sib-handler.js.map