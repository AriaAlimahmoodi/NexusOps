"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOutputsOutsideMerge = hasOutputsOutsideMerge;
exports.findDirectMergeInFanOut = findDirectMergeInFanOut;
exports.detectMergePattern = detectMergePattern;
exports.findMergeInputIndex = findMergeInputIndex;
const build_utils_1 = require("./composite-handlers/build-utils");
function hasOutputsOutsideMerge(node, mergeNode) {
    const mergeInputSources = new Set();
    for (const [, sources] of mergeNode.inputSources) {
        for (const source of sources) {
            mergeInputSources.add(source.from);
        }
    }
    for (const [outputName, connections] of node.outputs) {
        if (outputName === 'error')
            continue;
        for (const conn of connections) {
            if (conn.target !== mergeNode.name && !mergeInputSources.has(conn.target)) {
                return true;
            }
        }
    }
    return false;
}
function findDirectMergeInFanOut(targetNames, ctx) {
    let mergeTarget = null;
    const nonMergeTargets = [];
    for (const targetName of targetNames) {
        const node = ctx.graph.nodes.get(targetName);
        if (!node)
            continue;
        if ((0, build_utils_1.isMergeType)(node.type)) {
            if (mergeTarget !== null) {
                return null;
            }
            mergeTarget = node;
        }
        else {
            nonMergeTargets.push(targetName);
        }
    }
    if (!mergeTarget || nonMergeTargets.length === 0) {
        return null;
    }
    const mergeInputSources = new Set();
    for (const [, sources] of mergeTarget.inputSources) {
        for (const source of sources) {
            mergeInputSources.add(source.from);
        }
    }
    const allFeedIntoMerge = nonMergeTargets.every((targetName) => {
        if (mergeInputSources.has(targetName))
            return true;
        const targetNode = ctx.graph.nodes.get(targetName);
        if (targetNode) {
            const outputs = (0, build_utils_1.getAllFirstOutputTargets)(targetNode);
            if (outputs.includes(mergeTarget.name))
                return true;
        }
        return false;
    });
    if (!allFeedIntoMerge) {
        return null;
    }
    return { mergeNode: mergeTarget, nonMergeTargets };
}
function detectMergePattern(targetNames, ctx) {
    if (targetNames.length < 2)
        return null;
    const mergeTargets = new Map();
    for (const targetName of targetNames) {
        const targetNode = ctx.graph.nodes.get(targetName);
        if (!targetNode)
            continue;
        const nextTargets = (0, build_utils_1.getAllFirstOutputTargets)(targetNode);
        for (const nextTarget of nextTargets) {
            const nextNode = ctx.graph.nodes.get(nextTarget);
            if (nextNode && (0, build_utils_1.isMergeType)(nextNode.type)) {
                const branches = mergeTargets.get(nextTarget) ?? [];
                branches.push(targetName);
                mergeTargets.set(nextTarget, branches);
            }
        }
    }
    for (const [mergeName, branches] of mergeTargets) {
        if (branches.length === targetNames.length) {
            const mergeNode = ctx.graph.nodes.get(mergeName);
            if (mergeNode) {
                for (const branchName of branches) {
                    const branchNode = ctx.graph.nodes.get(branchName);
                    if (branchNode && hasOutputsOutsideMerge(branchNode, mergeNode)) {
                        return null;
                    }
                }
                return { mergeNode, branches };
            }
        }
    }
    return null;
}
function findMergeInputIndex(mergeNode, sourceName, sourceOutputSlot) {
    for (const [inputSlot, sources] of mergeNode.inputSources) {
        for (const source of sources) {
            if (source.from === sourceName) {
                if (sourceOutputSlot !== undefined) {
                    if (source.outputSlot === sourceOutputSlot) {
                        return (0, build_utils_1.extractInputIndex)(inputSlot);
                    }
                }
                else {
                    return (0, build_utils_1.extractInputIndex)(inputSlot);
                }
            }
        }
    }
    return 0;
}
//# sourceMappingURL=merge-pattern.js.map