"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorOutputTargets = exports.hasErrorOutput = void 0;
exports.buildErrorHandler = buildErrorHandler;
const build_utils_1 = require("./build-utils");
exports.hasErrorOutput = build_utils_1.hasErrorOutput;
exports.getErrorOutputTargets = build_utils_1.getErrorOutputTargets;
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
function buildErrorHandler(node, ctx) {
    if (!(0, exports.hasErrorOutput)(node)) {
        return undefined;
    }
    const errorTargets = (0, exports.getErrorOutputTargets)(node);
    if (errorTargets.length === 0) {
        return undefined;
    }
    const firstErrorTarget = errorTargets[0];
    if (ctx.visited.has(firstErrorTarget)) {
        const errorNode = ctx.graph.nodes.get(firstErrorTarget);
        if (errorNode) {
            ctx.variables.set(firstErrorTarget, errorNode);
            return (0, build_utils_1.createVarRef)(firstErrorTarget);
        }
        return undefined;
    }
    return buildFromNodeSimple(firstErrorTarget, ctx);
}
//# sourceMappingURL=error-handler.js.map