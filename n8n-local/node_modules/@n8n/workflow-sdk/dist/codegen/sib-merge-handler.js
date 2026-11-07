"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectSibMergePattern = detectSibMergePattern;
exports.buildSibMergeExplicitConnections = buildSibMergeExplicitConnections;
const build_utils_1 = require("./composite-handlers/build-utils");
function detectSibMergePattern(sibNode, ctx) {
    const doneTargets = sibNode.outputs.get('done') ?? [];
    const loopTargets = sibNode.outputs.get('loop') ?? [];
    const mergeConnections = new Map();
    for (const conn of doneTargets) {
        const targetNode = ctx.graph.nodes.get(conn.target);
        if (targetNode && (0, build_utils_1.isMergeType)(targetNode.type)) {
            const existing = mergeConnections.get(conn.target) ?? [];
            existing.push({
                sibOutput: 'done',
                sibOutputIndex: 0,
                mergeInputSlot: conn.targetInputSlot,
            });
            mergeConnections.set(conn.target, existing);
        }
    }
    for (const conn of loopTargets) {
        const targetNode = ctx.graph.nodes.get(conn.target);
        if (targetNode && (0, build_utils_1.isMergeType)(targetNode.type)) {
            const existing = mergeConnections.get(conn.target) ?? [];
            existing.push({
                sibOutput: 'loop',
                sibOutputIndex: 1,
                mergeInputSlot: conn.targetInputSlot,
            });
            mergeConnections.set(conn.target, existing);
        }
    }
    for (const [mergeName, conns] of mergeConnections) {
        const hasDone = conns.some((c) => c.sibOutput === 'done');
        const hasLoop = conns.some((c) => c.sibOutput === 'loop');
        if (hasDone && hasLoop) {
            const mergeNode = ctx.graph.nodes.get(mergeName);
            if (!mergeNode)
                continue;
            const connections = conns.map((c) => ({
                sibOutput: c.sibOutput,
                sibOutputIndex: c.sibOutputIndex,
                mergeInputSlot: c.mergeInputSlot,
                mergeInputIndex: parseInt(c.mergeInputSlot.replace('branch', ''), 10) || 0,
            }));
            const mergeOutputTargets = mergeNode.outputs.get('output') ?? [];
            const mergeOutputs = mergeOutputTargets.map((t) => ({
                target: t.target,
                inputSlot: t.targetInputSlot,
                inputIndex: parseInt(t.targetInputSlot.replace('input', ''), 10) || 0,
            }));
            return {
                sibNode,
                mergeNode,
                connections,
                mergeOutputs,
            };
        }
    }
    return null;
}
function buildSibMergeExplicitConnections(pattern, ctx) {
    const nodes = [pattern.sibNode, pattern.mergeNode];
    const connections = [];
    ctx.variables.set(pattern.sibNode.name, pattern.sibNode);
    ctx.variables.set(pattern.mergeNode.name, pattern.mergeNode);
    ctx.visited.add(pattern.sibNode.name);
    ctx.visited.add(pattern.mergeNode.name);
    for (const conn of pattern.connections) {
        connections.push({
            sourceNode: pattern.sibNode.name,
            sourceOutput: conn.sibOutputIndex,
            targetNode: pattern.mergeNode.name,
            targetInput: conn.mergeInputIndex,
        });
    }
    for (const output of pattern.mergeOutputs) {
        connections.push({
            sourceNode: pattern.mergeNode.name,
            sourceOutput: 0,
            targetNode: output.target,
            targetInput: output.inputIndex,
        });
    }
    return {
        kind: 'explicitConnections',
        nodes,
        connections,
    };
}
//# sourceMappingURL=sib-merge-handler.js.map