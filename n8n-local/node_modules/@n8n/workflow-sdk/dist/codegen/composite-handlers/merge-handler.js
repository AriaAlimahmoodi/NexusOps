"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMergeComposite = buildMergeComposite;
const build_utils_1 = require("./build-utils");
function buildMergeComposite(node, ctx) {
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
                targetNode: node,
                targetInputIndex: inputIndex,
            });
        }
    }
    return (0, build_utils_1.createVarRef)(node.name);
}
//# sourceMappingURL=merge-handler.js.map