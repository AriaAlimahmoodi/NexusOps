"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeferredConnection = createDeferredConnection;
exports.findMergeInputIndex = findMergeInputIndex;
exports.registerDeferredMerge = registerDeferredMerge;
exports.isDeferredMerge = isDeferredMerge;
exports.addDeferredMergeDownstream = addDeferredMergeDownstream;
const build_utils_1 = require("./composite-handlers/build-utils");
function createDeferredConnection(params, ctx) {
    ctx.deferredConnections.push({
        targetNode: params.targetNode,
        targetInputIndex: params.targetInputIndex,
        sourceNodeName: params.sourceNodeName,
        sourceOutputIndex: params.sourceOutputIndex,
    });
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
function registerDeferredMerge(mergeNode, ctx) {
    ctx.deferredMergeNodes.add(mergeNode.name);
}
function isDeferredMerge(mergeName, ctx) {
    return ctx.deferredMergeNodes.has(mergeName);
}
function addDeferredMergeDownstream(mergeNode, downstreamChain, ctx) {
    ctx.deferredMergeDownstreams.push({
        mergeNode,
        downstreamChain,
    });
}
//# sourceMappingURL=deferred-connections.js.map