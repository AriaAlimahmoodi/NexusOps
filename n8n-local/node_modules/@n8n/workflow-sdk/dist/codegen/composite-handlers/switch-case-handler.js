"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSwitchCaseComposite = buildSwitchCaseComposite;
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
function buildSwitchCaseComposite(node, ctx) {
    const cases = [];
    const caseIndices = [];
    const branchCtx = {
        ...ctx,
        isBranchContext: true,
    };
    for (const [outputName, connections] of node.outputs) {
        let outputIndex = 0;
        const caseMatch = outputName.match(/^case(\d+)$/);
        if (caseMatch) {
            outputIndex = parseInt(caseMatch[1], 10);
            caseIndices.push(outputIndex);
        }
        else if (outputName === 'fallback') {
            const params = node.json.parameters;
            const rules = params?.rules;
            const rulesArray = (rules?.rules ?? rules?.values);
            const fallbackIndex = rulesArray?.length ?? 4;
            caseIndices.push(fallbackIndex);
            outputIndex = fallbackIndex;
        }
        else {
            const outputMatch = outputName.match(/(\d+)$/);
            if (outputMatch) {
                outputIndex = parseInt(outputMatch[1], 10);
                caseIndices.push(outputIndex);
            }
            else {
                caseIndices.push(cases.length);
                outputIndex = cases.length;
            }
        }
        cases.push(buildBranchTargets(connections, branchCtx, node.name, outputIndex));
    }
    return {
        kind: 'switchCase',
        switchNode: node,
        cases,
        caseIndices,
    };
}
//# sourceMappingURL=switch-case-handler.js.map