"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIfElseComposite = buildIfElseComposite;
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
function buildIfElseComposite(node, ctx) {
    const trueBranchTargets = node.outputs.get('trueBranch') ?? [];
    const falseBranchTargets = node.outputs.get('falseBranch') ?? [];
    const branchCtx = {
        ...ctx,
        isBranchContext: true,
    };
    const trueBranch = buildBranchTargets(trueBranchTargets, branchCtx, node.name, 0);
    const falseBranch = buildBranchTargets(falseBranchTargets, branchCtx, node.name, 1);
    let errorHandler;
    if ((0, build_utils_1.hasErrorOutput)(node)) {
        const errorTargets = (0, build_utils_1.getErrorOutputTargets)(node);
        if (errorTargets.length > 0) {
            const firstErrorTarget = errorTargets[0];
            if (ctx.visited.has(firstErrorTarget)) {
                const errorTargetNode = ctx.graph.nodes.get(firstErrorTarget);
                if (errorTargetNode) {
                    ctx.variables.set(firstErrorTarget, errorTargetNode);
                    errorHandler = (0, build_utils_1.createVarRef)(firstErrorTarget);
                }
            }
            else {
                errorHandler = buildFromNodeSimple(firstErrorTarget, ctx);
            }
        }
    }
    return {
        kind: 'ifElse',
        ifNode: node,
        trueBranch,
        falseBranch,
        errorHandler,
    };
}
//# sourceMappingURL=if-else-handler.js.map