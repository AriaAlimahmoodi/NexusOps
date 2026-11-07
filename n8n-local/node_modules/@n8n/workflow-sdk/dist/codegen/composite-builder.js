"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCompositeTree = buildCompositeTree;
const build_utils_1 = require("./composite-handlers/build-utils");
const merge_pattern_1 = require("./merge-pattern");
const output_utils_1 = require("./output-utils");
const semantic_registry_1 = require("./semantic-registry");
const sib_merge_handler_1 = require("./sib-merge-handler");
function stripTrailingDeferredMergeVarRef(composite, deferredMergeNodes) {
    if (composite.kind !== 'chain')
        return composite;
    const last = composite.nodes[composite.nodes.length - 1];
    if (last?.kind === 'varRef' && deferredMergeNodes.has(last.nodeName)) {
        if (composite.nodes.length === 2) {
            return composite.nodes[0];
        }
        return { kind: 'chain', nodes: composite.nodes.slice(0, -1) };
    }
    return composite;
}
function buildBranchTargets(targets, ctx, sourceNodeName, sourceOutputIndex) {
    if (targets.length === 0)
        return null;
    if (targets.length === 1) {
        const singleTarget = targets[0];
        const targetNode = ctx.graph.nodes.get(singleTarget.target);
        if (ctx.isBranchContext && targetNode && (0, build_utils_1.isMergeType)(targetNode.type) && sourceNodeName) {
            ctx.visited.add(singleTarget.target);
            ctx.variables.set(singleTarget.target, targetNode);
            ctx.deferredMergeNodes.add(singleTarget.target);
            let inputIndex = 0;
            if (singleTarget.targetInputSlot) {
                inputIndex = (0, build_utils_1.extractInputIndex)(singleTarget.targetInputSlot);
            }
            else {
                const sourceNode = ctx.graph.nodes.get(sourceNodeName);
                const isSwitch = sourceNode && (0, build_utils_1.isSwitchType)(sourceNode.type);
                const outputSlotName = (0, build_utils_1.getOutputSlotName)(sourceOutputIndex ?? 0, isSwitch);
                inputIndex = (0, merge_pattern_1.findMergeInputIndex)(targetNode, sourceNodeName, outputSlotName);
            }
            ctx.deferredConnections.push({
                sourceNodeName,
                sourceOutputIndex: sourceOutputIndex ?? 0,
                targetNode,
                targetInputIndex: inputIndex,
            });
            return null;
        }
        if (targetNode && sourceNodeName && singleTarget.targetInputSlot) {
            const targetInputIndex = (0, build_utils_1.extractInputIndex)(singleTarget.targetInputSlot);
            if (targetInputIndex > 0) {
                ctx.variables.set(sourceNodeName, ctx.graph.nodes.get(sourceNodeName) ?? targetNode);
                ctx.variables.set(singleTarget.target, targetNode);
                ctx.deferredConnections.push({
                    sourceNodeName,
                    sourceOutputIndex: sourceOutputIndex ?? 0,
                    targetNode,
                    targetInputIndex,
                });
                return null;
            }
        }
        return buildFromNode(singleTarget.target, ctx);
    }
    const targetNames = targets.map((t) => t.target);
    const directMergePattern = (0, merge_pattern_1.findDirectMergeInFanOut)(targetNames, ctx);
    if (directMergePattern) {
        const { mergeNode, nonMergeTargets } = directMergePattern;
        if (ctx.isBranchContext) {
            ctx.visited.add(mergeNode.name);
            ctx.variables.set(mergeNode.name, mergeNode);
            const builtBranches = [];
            for (const targetName of nonMergeTargets) {
                if (ctx.visited.has(targetName)) {
                    const targetNode = ctx.graph.nodes.get(targetName);
                    if (targetNode) {
                        ctx.variables.set(targetName, targetNode);
                        builtBranches.push((0, build_utils_1.createVarRef)(targetName));
                    }
                }
                else {
                    builtBranches.push(buildFromNode(targetName, ctx));
                }
            }
            if (targetNames.includes(mergeNode.name) && sourceNodeName) {
                const directTarget = targets.find((t) => t.target === mergeNode.name);
                let inputIndex = 0;
                if (directTarget?.targetInputSlot) {
                    inputIndex = (0, build_utils_1.extractInputIndex)(directTarget.targetInputSlot);
                }
                else {
                    inputIndex = (0, merge_pattern_1.findMergeInputIndex)(mergeNode, sourceNodeName);
                }
                ctx.deferredConnections.push({
                    targetNode: mergeNode,
                    targetInputIndex: inputIndex,
                    sourceNodeName,
                    sourceOutputIndex: sourceOutputIndex ?? 0,
                });
                ctx.deferredMergeNodes.add(mergeNode.name);
            }
            if (builtBranches.length === 0)
                return null;
            if (builtBranches.length === 1)
                return builtBranches[0];
            return builtBranches;
        }
        ctx.visited.add(mergeNode.name);
        ctx.variables.set(mergeNode.name, mergeNode);
        ctx.deferredMergeNodes.add(mergeNode.name);
        for (const [inputSlot, sources] of mergeNode.inputSources) {
            const inputIndex = (0, build_utils_1.extractInputIndex)(inputSlot);
            for (const source of sources) {
                const sourceNode = ctx.graph.nodes.get(source.from);
                if (sourceNode) {
                    ctx.variables.set(source.from, sourceNode);
                }
                ctx.deferredConnections.push({
                    sourceNodeName: source.from,
                    sourceOutputIndex: (0, build_utils_1.getOutputIndex)(source.outputSlot),
                    isErrorOutput: source.outputSlot === 'error' || undefined,
                    targetNode: mergeNode,
                    targetInputIndex: inputIndex,
                });
            }
        }
        const builtBranches = [];
        for (const targetName of nonMergeTargets) {
            if (!ctx.visited.has(targetName)) {
                builtBranches.push(buildFromNode(targetName, ctx));
            }
        }
        if (builtBranches.length === 0)
            return (0, build_utils_1.createVarRef)(mergeNode.name);
        if (builtBranches.length === 1)
            return builtBranches[0];
        return builtBranches;
    }
    if (ctx.isBranchContext && sourceNodeName) {
        for (const targetConn of targets) {
            const target = targetConn.target;
            const targetNode = ctx.graph.nodes.get(target);
            if (targetNode && (0, build_utils_1.isMergeType)(targetNode.type)) {
                ctx.visited.add(target);
                ctx.variables.set(target, targetNode);
                let inputIndex = 0;
                if (targetConn.targetInputSlot) {
                    inputIndex = (0, build_utils_1.extractInputIndex)(targetConn.targetInputSlot);
                }
                else {
                    inputIndex = (0, merge_pattern_1.findMergeInputIndex)(targetNode, sourceNodeName);
                }
                ctx.deferredConnections.push({
                    targetNode,
                    targetInputIndex: inputIndex,
                    sourceNodeName,
                    sourceOutputIndex: sourceOutputIndex ?? 0,
                });
                ctx.deferredMergeNodes.add(target);
            }
        }
    }
    const branches = [];
    for (const targetConn of targets) {
        const target = targetConn.target;
        const targetNode = ctx.graph.nodes.get(target);
        if (ctx.isBranchContext && sourceNodeName && targetNode && (0, build_utils_1.isMergeType)(targetNode.type)) {
            continue;
        }
        if (ctx.visited.has(target)) {
            if (targetNode) {
                ctx.variables.set(target, targetNode);
                branches.push((0, build_utils_1.createVarRef)(target));
            }
        }
        else {
            branches.push(buildFromNode(target, ctx));
        }
    }
    if (branches.length === 0)
        return null;
    if (branches.length === 1)
        return branches[0];
    return branches;
}
function buildIfElse(node, ctx) {
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
            const errorTargetNode = ctx.graph.nodes.get(firstErrorTarget);
            if (errorTargetNode && (0, build_utils_1.isMergeType)(errorTargetNode.type)) {
                ctx.variables.set(node.name, node);
                ctx.variables.set(firstErrorTarget, errorTargetNode);
                const errorConns = node.outputs.get('error') ?? [];
                const errorConn = errorConns.find((c) => c.target === firstErrorTarget);
                const targetInputIndex = errorConn ? (0, build_utils_1.extractInputIndex)(errorConn.targetInputSlot) : 0;
                ctx.deferredConnections.push({
                    sourceNodeName: node.name,
                    sourceOutputIndex: 0,
                    targetNode: errorTargetNode,
                    targetInputIndex,
                    isErrorOutput: true,
                });
            }
            else if (ctx.visited.has(firstErrorTarget)) {
                if (errorTargetNode) {
                    ctx.variables.set(firstErrorTarget, errorTargetNode);
                    errorHandler = (0, build_utils_1.createVarRef)(firstErrorTarget);
                }
            }
            else {
                errorHandler = buildFromNode(firstErrorTarget, ctx);
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
function buildSwitchCase(node, ctx) {
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
            const caseIndex = parseInt(caseMatch[1], 10);
            caseIndices.push(caseIndex);
            outputIndex = caseIndex;
        }
        else if (outputName === 'fallback') {
            const params = node.json.parameters;
            const rules = params?.rules;
            const rulesArray = (rules?.rules ?? rules?.values);
            const numCases = rulesArray?.length ?? 4;
            const fallbackIndex = numCases;
            caseIndices.push(fallbackIndex);
            outputIndex = fallbackIndex;
        }
        else {
            const outputMatch = outputName.match(/(\d+)$/);
            if (outputMatch) {
                const idx = parseInt(outputMatch[1], 10);
                caseIndices.push(idx);
                outputIndex = idx;
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
function buildMerge(node, ctx) {
    ctx.variables.set(node.name, node);
    ctx.deferredMergeNodes.add(node.name);
    for (const [inputSlot, sources] of node.inputSources) {
        const inputIndex = (0, build_utils_1.extractInputIndex)(inputSlot);
        for (const source of sources) {
            const sourceNode = ctx.graph.nodes.get(source.from);
            if (sourceNode) {
                ctx.variables.set(source.from, sourceNode);
            }
            ctx.deferredConnections.push({
                sourceNodeName: source.from,
                sourceOutputIndex: (0, build_utils_1.getOutputIndex)(source.outputSlot),
                isErrorOutput: source.outputSlot === 'error' || undefined,
                targetNode: node,
                targetInputIndex: inputIndex,
            });
        }
    }
    return (0, build_utils_1.createVarRef)(node.name);
}
function buildSplitInBatches(node, ctx) {
    const sibMergePattern = (0, sib_merge_handler_1.detectSibMergePattern)(node, ctx);
    if (sibMergePattern) {
        return (0, sib_merge_handler_1.buildSibMergeExplicitConnections)(sibMergePattern, ctx);
    }
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
function buildFromNode(nodeName, ctx) {
    const node = ctx.graph.nodes.get(nodeName);
    if (!node) {
        return (0, build_utils_1.createVarRef)(nodeName);
    }
    if (ctx.visited.has(nodeName)) {
        ctx.variables.set(nodeName, node);
        return (0, build_utils_1.createVarRef)(nodeName);
    }
    if ((0, build_utils_1.shouldBeVariable)(node)) {
        ctx.variables.set(nodeName, node);
    }
    ctx.visited.add(nodeName);
    const compositeType = (0, semantic_registry_1.getCompositeType)(node.type);
    let compositeNode;
    switch (compositeType) {
        case 'ifElse':
            compositeNode = buildIfElse(node, ctx);
            break;
        case 'switchCase':
            compositeNode = buildSwitchCase(node, ctx);
            break;
        case 'merge':
            compositeNode = buildMerge(node, ctx);
            break;
        case 'splitInBatches':
            compositeNode = buildSplitInBatches(node, ctx);
            break;
        default: {
            let errorHandler;
            if ((0, build_utils_1.hasErrorOutput)(node)) {
                const errorTargets = (0, build_utils_1.getErrorOutputTargets)(node);
                if (errorTargets.length > 0) {
                    const firstErrorTarget = errorTargets[0];
                    const errorTargetNode = ctx.graph.nodes.get(firstErrorTarget);
                    if (errorTargetNode && (0, build_utils_1.isMergeType)(errorTargetNode.type)) {
                        ctx.variables.set(node.name, node);
                        ctx.variables.set(firstErrorTarget, errorTargetNode);
                        const errorConns = node.outputs.get('error') ?? [];
                        const errorConn = errorConns.find((c) => c.target === firstErrorTarget);
                        const targetInputIndex = errorConn ? (0, build_utils_1.extractInputIndex)(errorConn.targetInputSlot) : 0;
                        ctx.deferredConnections.push({
                            sourceNodeName: node.name,
                            sourceOutputIndex: 0,
                            targetNode: errorTargetNode,
                            targetInputIndex,
                            isErrorOutput: true,
                        });
                    }
                    else if (ctx.visited.has(firstErrorTarget)) {
                        if (errorTargetNode) {
                            ctx.variables.set(firstErrorTarget, errorTargetNode);
                            errorHandler = (0, build_utils_1.createVarRef)(firstErrorTarget);
                        }
                    }
                    else {
                        errorHandler = buildFromNode(firstErrorTarget, ctx);
                    }
                }
            }
            compositeNode = (0, build_utils_1.createLeaf)(node, errorHandler);
        }
    }
    if (compositeType === 'merge') {
        return compositeNode;
    }
    if (compositeType === undefined) {
        if ((0, output_utils_1.hasMultipleOutputSlots)(node) || (0, output_utils_1.hasNonZeroOutputIndex)(node)) {
            const targetsByIndex = (0, output_utils_1.getOutputTargetsByIndex)(node);
            const outputTargets = new Map();
            for (const [outputIndex, targets] of targetsByIndex) {
                if (targets.length === 1) {
                    const targetInfo = targets[0];
                    if (targetInfo.targetName === node.name)
                        continue;
                    const targetNode = ctx.graph.nodes.get(targetInfo.targetName);
                    if (targetNode) {
                        const targetInputIndex = (0, build_utils_1.extractInputIndex)(targetInfo.targetInputSlot);
                        if (targetInputIndex > 0) {
                            ctx.variables.set(node.name, node);
                            ctx.variables.set(targetInfo.targetName, targetNode);
                            ctx.deferredConnections.push({
                                targetNode,
                                targetInputIndex,
                                sourceNodeName: node.name,
                                sourceOutputIndex: outputIndex,
                            });
                        }
                        else if (ctx.visited.has(targetInfo.targetName)) {
                            ctx.variables.set(targetInfo.targetName, targetNode);
                            outputTargets.set(outputIndex, (0, build_utils_1.createVarRef)(targetInfo.targetName));
                        }
                        else {
                            outputTargets.set(outputIndex, buildFromNode(targetInfo.targetName, ctx));
                        }
                    }
                }
                else if (targets.length > 1) {
                    const fanOutBranches = [];
                    for (const targetInfo of targets) {
                        if (targetInfo.targetName === node.name)
                            continue;
                        const targetNode = ctx.graph.nodes.get(targetInfo.targetName);
                        if (targetNode) {
                            const targetInputIndex = (0, build_utils_1.extractInputIndex)(targetInfo.targetInputSlot);
                            if (targetInputIndex > 0) {
                                ctx.variables.set(node.name, node);
                                ctx.variables.set(targetInfo.targetName, targetNode);
                                ctx.deferredConnections.push({
                                    targetNode,
                                    targetInputIndex,
                                    sourceNodeName: node.name,
                                    sourceOutputIndex: outputIndex,
                                });
                            }
                            else if (ctx.visited.has(targetInfo.targetName)) {
                                ctx.variables.set(targetInfo.targetName, targetNode);
                                fanOutBranches.push((0, build_utils_1.createVarRef)(targetInfo.targetName));
                            }
                            else {
                                fanOutBranches.push(buildFromNode(targetInfo.targetName, ctx));
                            }
                        }
                    }
                    if (fanOutBranches.length > 0) {
                        const fanOut = {
                            kind: 'fanOut',
                            sourceNode: (0, build_utils_1.createLeaf)(node),
                            targets: fanOutBranches,
                        };
                        outputTargets.set(outputIndex, fanOut);
                    }
                }
            }
            const hasDeferred = ctx.deferredConnections.some((c) => c.sourceNodeName === node.name);
            if (outputTargets.size > 0 || hasDeferred) {
                ctx.variables.set(node.name, node);
                const multiOutput = {
                    kind: 'multiOutput',
                    sourceNode: node,
                    outputTargets,
                };
                return multiOutput;
            }
        }
        const nextTargets = (0, output_utils_1.hasMultipleOutputSlots)(node)
            ? (0, output_utils_1.getAllOutputTargets)(node)
            : (0, build_utils_1.getAllFirstOutputTargets)(node);
        if (nextTargets.length > 1) {
            const mergePattern = (0, merge_pattern_1.detectMergePattern)(nextTargets, ctx);
            if (mergePattern) {
                ctx.variables.set(mergePattern.mergeNode.name, mergePattern.mergeNode);
                ctx.deferredMergeNodes.add(mergePattern.mergeNode.name);
                ctx.visited.add(mergePattern.mergeNode.name);
                for (const [inputSlot, sources] of mergePattern.mergeNode.inputSources) {
                    const inputIndex = (0, build_utils_1.extractInputIndex)(inputSlot);
                    for (const source of sources) {
                        const sourceNode = ctx.graph.nodes.get(source.from);
                        if (sourceNode) {
                            ctx.variables.set(source.from, sourceNode);
                        }
                        ctx.deferredConnections.push({
                            sourceNodeName: source.from,
                            sourceOutputIndex: (0, build_utils_1.getOutputIndex)(source.outputSlot),
                            isErrorOutput: source.outputSlot === 'error' || undefined,
                            targetNode: mergePattern.mergeNode,
                            targetInputIndex: inputIndex,
                        });
                    }
                }
                const builtBranches = [];
                for (const branchName of mergePattern.branches) {
                    if (!ctx.visited.has(branchName)) {
                        const branchNode = ctx.graph.nodes.get(branchName);
                        if (branchNode && (0, build_utils_1.isMergeType)(branchNode.type)) {
                            ctx.visited.add(branchName);
                            ctx.variables.set(branchName, branchNode);
                            ctx.deferredMergeNodes.add(branchName);
                            const inputIndex = (0, merge_pattern_1.findMergeInputIndex)(branchNode, node.name);
                            ctx.deferredConnections.push({
                                sourceNodeName: node.name,
                                sourceOutputIndex: 0,
                                targetNode: branchNode,
                                targetInputIndex: inputIndex,
                            });
                            for (const [inputSlot, sources] of branchNode.inputSources) {
                                const idx = (0, build_utils_1.extractInputIndex)(inputSlot);
                                for (const source of sources) {
                                    if (source.from === node.name)
                                        continue;
                                    const sourceNode = ctx.graph.nodes.get(source.from);
                                    if (sourceNode) {
                                        ctx.variables.set(source.from, sourceNode);
                                    }
                                    ctx.deferredConnections.push({
                                        sourceNodeName: source.from,
                                        sourceOutputIndex: (0, build_utils_1.getOutputIndex)(source.outputSlot),
                                        isErrorOutput: source.outputSlot === 'error' || undefined,
                                        targetNode: branchNode,
                                        targetInputIndex: idx,
                                    });
                                }
                            }
                        }
                        else {
                            builtBranches.push(buildFromNode(branchName, ctx));
                        }
                    }
                    else {
                        const branchNode = ctx.graph.nodes.get(branchName);
                        if (branchNode) {
                            ctx.variables.set(branchName, branchNode);
                            if ((0, build_utils_1.isMergeType)(branchNode.type)) {
                                ctx.deferredMergeNodes.add(branchName);
                                const alreadyHasConnection = ctx.deferredConnections.some((c) => c.sourceNodeName === node.name && c.targetNode.name === branchName);
                                if (!alreadyHasConnection) {
                                    const inputIndex = (0, merge_pattern_1.findMergeInputIndex)(branchNode, node.name);
                                    ctx.deferredConnections.push({
                                        sourceNodeName: node.name,
                                        sourceOutputIndex: 0,
                                        targetNode: branchNode,
                                        targetInputIndex: inputIndex,
                                    });
                                }
                            }
                            else {
                                builtBranches.push((0, build_utils_1.createVarRef)(branchName));
                            }
                        }
                    }
                }
                if (builtBranches.length > 0) {
                    if (builtBranches.length === 1) {
                        return {
                            kind: 'chain',
                            nodes: [compositeNode, builtBranches[0]],
                        };
                    }
                    const fanOut = {
                        kind: 'fanOut',
                        sourceNode: compositeNode,
                        targets: builtBranches,
                    };
                    return fanOut;
                }
                return compositeNode;
            }
            const directMergePattern = (0, merge_pattern_1.findDirectMergeInFanOut)(nextTargets, ctx);
            if (directMergePattern) {
                const { mergeNode, nonMergeTargets } = directMergePattern;
                ctx.visited.add(mergeNode.name);
                ctx.variables.set(mergeNode.name, mergeNode);
                ctx.deferredMergeNodes.add(mergeNode.name);
                for (const [inputSlot, sources] of mergeNode.inputSources) {
                    const inputIndex = (0, build_utils_1.extractInputIndex)(inputSlot);
                    for (const source of sources) {
                        const sourceNode = ctx.graph.nodes.get(source.from);
                        if (sourceNode) {
                            ctx.variables.set(source.from, sourceNode);
                        }
                        ctx.deferredConnections.push({
                            sourceNodeName: source.from,
                            sourceOutputIndex: (0, build_utils_1.getOutputIndex)(source.outputSlot),
                            isErrorOutput: source.outputSlot === 'error' || undefined,
                            targetNode: mergeNode,
                            targetInputIndex: inputIndex,
                        });
                    }
                }
                const builtBranches = [];
                for (const targetName of nonMergeTargets) {
                    if (!ctx.visited.has(targetName)) {
                        builtBranches.push(buildFromNode(targetName, ctx));
                    }
                }
                if (builtBranches.length === 0) {
                    return compositeNode;
                }
                if (builtBranches.length === 1) {
                    return {
                        kind: 'chain',
                        nodes: [compositeNode, builtBranches[0]],
                    };
                }
                const fanOut = {
                    kind: 'fanOut',
                    sourceNode: compositeNode,
                    targets: builtBranches,
                };
                return fanOut;
            }
            const outputConnections = [];
            for (const [outputSlot, connections] of node.outputs) {
                if (outputSlot === 'error')
                    continue;
                for (const conn of connections) {
                    if (conn.target === node.name)
                        continue;
                    outputConnections.push({
                        target: conn.target,
                        targetInputSlot: conn.targetInputSlot,
                        outputSlot,
                    });
                }
            }
            const handledMerges = new Set();
            const nonMergeTargets = [];
            for (const conn of outputConnections) {
                const targetNode = ctx.graph.nodes.get(conn.target);
                if (!targetNode)
                    continue;
                if ((0, build_utils_1.isMergeType)(targetNode.type)) {
                    if (!handledMerges.has(conn.target)) {
                        ctx.visited.add(conn.target);
                        ctx.variables.set(conn.target, targetNode);
                        ctx.deferredMergeNodes.add(conn.target);
                        handledMerges.add(conn.target);
                    }
                    const inputIndex = (0, build_utils_1.extractInputIndex)(conn.targetInputSlot);
                    const sourceOutputIndex = (0, build_utils_1.getOutputIndex)(conn.outputSlot);
                    ctx.deferredConnections.push({
                        sourceNodeName: node.name,
                        sourceOutputIndex,
                        targetNode,
                        targetInputIndex: inputIndex,
                        isErrorOutput: conn.outputSlot === 'error' || undefined,
                    });
                }
                else if (!nonMergeTargets.some((t) => t.target === conn.target)) {
                    nonMergeTargets.push({
                        target: conn.target,
                        targetInputSlot: conn.targetInputSlot,
                        outputSlot: conn.outputSlot,
                    });
                }
            }
            const fanOutBranches = [];
            for (const targetInfo of nonMergeTargets) {
                const targetNode = ctx.graph.nodes.get(targetInfo.target);
                if (targetNode) {
                    const targetInputIndex = (0, build_utils_1.extractInputIndex)(targetInfo.targetInputSlot);
                    if (targetInputIndex > 0) {
                        ctx.variables.set(node.name, node);
                        ctx.variables.set(targetInfo.target, targetNode);
                        ctx.deferredConnections.push({
                            targetNode,
                            targetInputIndex,
                            sourceNodeName: node.name,
                            sourceOutputIndex: (0, build_utils_1.getOutputIndex)(targetInfo.outputSlot),
                            isErrorOutput: targetInfo.outputSlot === 'error' || undefined,
                        });
                    }
                    else if (ctx.visited.has(targetInfo.target)) {
                        ctx.variables.set(targetInfo.target, targetNode);
                        fanOutBranches.push((0, build_utils_1.createVarRef)(targetInfo.target));
                    }
                    else {
                        const branchComposite = buildFromNode(targetInfo.target, ctx);
                        fanOutBranches.push(stripTrailingDeferredMergeVarRef(branchComposite, ctx.deferredMergeNodes));
                    }
                }
            }
            if (fanOutBranches.length > 0) {
                if (fanOutBranches.length === 1) {
                    const firstBranch = fanOutBranches[0];
                    if (firstBranch.kind === 'chain') {
                        return {
                            kind: 'chain',
                            nodes: [compositeNode, ...firstBranch.nodes],
                        };
                    }
                    return {
                        kind: 'chain',
                        nodes: [compositeNode, firstBranch],
                    };
                }
                const fanOut = {
                    kind: 'fanOut',
                    sourceNode: compositeNode,
                    targets: fanOutBranches,
                };
                return fanOut;
            }
        }
        else if (nextTargets.length === 1) {
            const nextTarget = nextTargets[0];
            const nextNode = ctx.graph.nodes.get(nextTarget);
            if (ctx.isBranchContext && nextNode && (0, build_utils_1.isMergeType)(nextNode.type)) {
                ctx.visited.add(nextTarget);
                ctx.variables.set(nextTarget, nextNode);
                const inputIndex = (0, merge_pattern_1.findMergeInputIndex)(nextNode, node.name);
                ctx.deferredConnections.push({
                    targetNode: nextNode,
                    targetInputIndex: inputIndex,
                    sourceNodeName: node.name,
                    sourceOutputIndex: 0,
                });
                ctx.deferredMergeNodes.add(nextTarget);
                return compositeNode;
            }
            if (nextNode && (0, build_utils_1.isMergeType)(nextNode.type) && ctx.deferredMergeNodes.has(nextTarget)) {
                const alreadyHasConnection = ctx.deferredConnections.some((c) => c.sourceNodeName === node.name && c.targetNode.name === nextTarget);
                if (!alreadyHasConnection) {
                    const inputIndex = (0, merge_pattern_1.findMergeInputIndex)(nextNode, node.name);
                    ctx.deferredConnections.push({
                        targetNode: nextNode,
                        targetInputIndex: inputIndex,
                        sourceNodeName: node.name,
                        sourceOutputIndex: 0,
                    });
                }
                return compositeNode;
            }
            if (nextNode && !(0, build_utils_1.isMergeType)(nextNode.type)) {
                let targetInputSlot = 'input0';
                let sourceOutputSlot = 'output0';
                for (const [outputName, connections] of node.outputs) {
                    if (outputName === 'error')
                        continue;
                    for (const conn of connections) {
                        if (conn.target === nextTarget) {
                            targetInputSlot = conn.targetInputSlot;
                            sourceOutputSlot = outputName;
                            break;
                        }
                    }
                }
                const targetInputIndex = (0, build_utils_1.extractInputIndex)(targetInputSlot);
                if (targetInputIndex > 0) {
                    ctx.variables.set(node.name, node);
                    ctx.variables.set(nextTarget, nextNode);
                    ctx.deferredConnections.push({
                        targetNode: nextNode,
                        targetInputIndex,
                        sourceNodeName: node.name,
                        sourceOutputIndex: (0, build_utils_1.getOutputIndex)(sourceOutputSlot),
                        isErrorOutput: sourceOutputSlot === 'error' || undefined,
                    });
                    return compositeNode;
                }
            }
            const nextComposite = buildFromNode(nextTarget, ctx);
            if (ctx.deferredMergeNodes.has(nextTarget)) {
                return compositeNode;
            }
            if (nextComposite.kind === 'chain') {
                return {
                    kind: 'chain',
                    nodes: [compositeNode, ...nextComposite.nodes],
                };
            }
            else {
                return {
                    kind: 'chain',
                    nodes: [compositeNode, nextComposite],
                };
            }
        }
    }
    else {
        const outputConnections = node.outputs.get('output') ?? node.outputs.get('output0') ?? [];
        if (outputConnections.length > 0 && compositeType !== 'splitInBatches') {
            const nextTarget = outputConnections[0].target;
            const nextComposite = buildFromNode(nextTarget, ctx);
            if (ctx.deferredMergeNodes.has(nextTarget)) {
                return compositeNode;
            }
            return {
                kind: 'chain',
                nodes: [compositeNode, nextComposite],
            };
        }
    }
    return compositeNode;
}
function getDownstreamTargetName(chain) {
    if (!chain)
        return '';
    switch (chain.kind) {
        case 'varRef':
            return chain.nodeName;
        case 'leaf':
            return chain.node.name;
        case 'chain':
            return chain.nodes.length > 0 ? getDownstreamTargetName(chain.nodes[0]) : '';
        case 'ifElse':
            return chain.ifNode.name;
        case 'switchCase':
            return chain.switchNode.name;
        case 'merge':
            return chain.mergeNode.name;
        case 'splitInBatches':
            return chain.sibNode.name;
        case 'fanOut':
            return getDownstreamTargetName(chain.sourceNode);
        case 'explicitConnections':
            return chain.nodes.length > 0 ? chain.nodes[0].name : '';
        case 'multiOutput':
            return chain.sourceNode.name;
        default:
            return '';
    }
}
function buildCompositeTree(graph) {
    const ctx = {
        graph,
        visited: new Set(),
        variables: new Map(),
        isBranchContext: false,
        deferredConnections: [],
        deferredMergeDownstreams: [],
        deferredMergeNodes: new Set(),
    };
    const roots = [];
    for (const rootName of graph.roots) {
        const composite = buildFromNode(rootName, ctx);
        roots.push(composite);
    }
    for (const mergeNodeName of ctx.deferredMergeNodes) {
        const mergeNode = graph.nodes.get(mergeNodeName);
        if (!mergeNode)
            continue;
        const mergeOutputs = mergeNode.outputs.get('output') ?? [];
        for (const output of mergeOutputs) {
            const targetName = output.target;
            const targetNode = graph.nodes.get(targetName);
            if (!targetNode)
                continue;
            if ((0, build_utils_1.isMergeType)(targetNode.type)) {
                ctx.deferredMergeNodes.add(targetName);
                ctx.variables.set(targetName, targetNode);
                ctx.visited.add(targetName);
                const inputIndex = (0, build_utils_1.extractInputIndex)(output.targetInputSlot);
                ctx.deferredConnections.push({
                    targetNode,
                    targetInputIndex: inputIndex,
                    sourceNodeName: mergeNodeName,
                    sourceOutputIndex: 0,
                });
                continue;
            }
            if (!ctx.visited.has(targetName)) {
                const downstreamCtx = {
                    ...ctx,
                    isBranchContext: false,
                };
                const downstreamChain = buildFromNode(targetName, downstreamCtx);
                ctx.deferredMergeDownstreams.push({
                    mergeNode,
                    downstreamChain,
                });
            }
            else {
                ctx.variables.set(targetName, targetNode);
                ctx.deferredMergeDownstreams.push({
                    mergeNode,
                    downstreamChain: (0, build_utils_1.createVarRef)(targetName),
                });
            }
        }
    }
    const seenConnections = new Set();
    const uniqueConnections = ctx.deferredConnections.filter((conn) => {
        const key = `${conn.sourceNodeName}:${conn.sourceOutputIndex}->${conn.targetNode.name}:${conn.targetInputIndex}:${conn.isErrorOutput ?? false}`;
        if (seenConnections.has(key))
            return false;
        seenConnections.add(key);
        return true;
    });
    const seenMergeDownstreams = new Set();
    const uniqueMergeDownstreams = ctx.deferredMergeDownstreams.filter((d) => {
        const targetName = getDownstreamTargetName(d.downstreamChain);
        const key = `${d.mergeNode.name}->${targetName}`;
        if (seenMergeDownstreams.has(key))
            return false;
        seenMergeDownstreams.add(key);
        return true;
    });
    return {
        roots,
        variables: ctx.variables,
        deferredConnections: uniqueConnections,
        deferredMergeDownstreams: uniqueMergeDownstreams,
    };
}
//# sourceMappingURL=composite-builder.js.map