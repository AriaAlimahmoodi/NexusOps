"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOutputTargets = getAllOutputTargets;
exports.hasMultipleOutputSlots = hasMultipleOutputSlots;
exports.hasConsecutiveOutputSlots = hasConsecutiveOutputSlots;
exports.hasNonZeroOutputIndex = hasNonZeroOutputIndex;
exports.getOutputTargetsByIndex = getOutputTargetsByIndex;
const build_utils_1 = require("./composite-handlers/build-utils");
function getAllOutputTargets(node) {
    const targets = [];
    for (const [outputName, connections] of node.outputs) {
        if (outputName === 'error')
            continue;
        for (const conn of connections) {
            if (!targets.includes(conn.target)) {
                targets.push(conn.target);
            }
        }
    }
    return targets;
}
function hasMultipleOutputSlots(node) {
    let nonEmptySlots = 0;
    for (const [outputName, connections] of node.outputs) {
        if (outputName === 'error')
            continue;
        if (connections.length > 0) {
            nonEmptySlots++;
        }
    }
    return nonEmptySlots > 1;
}
function hasConsecutiveOutputSlots(node) {
    const occupiedIndices = [];
    for (const [outputName, connections] of node.outputs) {
        if (outputName === 'error')
            continue;
        if (connections.length > 0) {
            const index = (0, build_utils_1.getOutputIndex)(outputName);
            occupiedIndices.push(index);
        }
    }
    if (occupiedIndices.length <= 1)
        return true;
    occupiedIndices.sort((a, b) => a - b);
    for (let i = 1; i < occupiedIndices.length; i++) {
        if (occupiedIndices[i] !== occupiedIndices[i - 1] + 1) {
            return false;
        }
    }
    return true;
}
function hasNonZeroOutputIndex(node) {
    for (const [outputName, connections] of node.outputs) {
        if (outputName === 'error')
            continue;
        if (connections.length > 0 && (0, build_utils_1.getOutputIndex)(outputName) > 0) {
            return true;
        }
    }
    return false;
}
function getOutputTargetsByIndex(node) {
    const result = new Map();
    for (const [outputName, connections] of node.outputs) {
        if (outputName === 'error')
            continue;
        if (connections.length === 0)
            continue;
        const outputIndex = (0, build_utils_1.getOutputIndex)(outputName);
        const targets = connections.map((c) => ({
            targetName: c.target,
            targetInputSlot: c.targetInputSlot,
        }));
        result.set(outputIndex, targets);
    }
    return result;
}
//# sourceMappingURL=output-utils.js.map