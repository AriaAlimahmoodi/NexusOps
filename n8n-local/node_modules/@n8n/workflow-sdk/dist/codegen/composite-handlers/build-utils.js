"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toVarName = void 0;
exports.createLeaf = createLeaf;
exports.createVarRef = createVarRef;
exports.shouldBeVariable = shouldBeVariable;
exports.isMergeType = isMergeType;
exports.isSwitchType = isSwitchType;
exports.extractInputIndex = extractInputIndex;
exports.getOutputIndex = getOutputIndex;
exports.getOutputSlotName = getOutputSlotName;
exports.getAllFirstOutputTargets = getAllFirstOutputTargets;
exports.hasErrorOutput = hasErrorOutput;
exports.getErrorOutputTargets = getErrorOutputTargets;
const node_types_1 = require("../../constants/node-types");
const variable_names_1 = require("../variable-names");
var variable_names_2 = require("../variable-names");
Object.defineProperty(exports, "toVarName", { enumerable: true, get: function () { return variable_names_2.toVarName; } });
function createLeaf(node, errorHandler) {
    const leaf = { kind: 'leaf', node };
    if (errorHandler) {
        leaf.errorHandler = errorHandler;
    }
    return leaf;
}
function createVarRef(nodeName) {
    return {
        kind: 'varRef',
        varName: (0, variable_names_1.toVarName)(nodeName),
        nodeName,
    };
}
function shouldBeVariable(node) {
    if ((0, node_types_1.isStickyNoteType)(node.type)) {
        return false;
    }
    return true;
}
function isMergeType(type) {
    return (0, node_types_1.isMergeNodeType)(type);
}
function isSwitchType(type) {
    return (0, node_types_1.isSwitchNodeType)(type);
}
function extractInputIndex(slotName) {
    const match = slotName.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
}
function getOutputIndex(outputName) {
    if (outputName === 'trueBranch')
        return 0;
    if (outputName === 'falseBranch')
        return 1;
    if (outputName === 'done')
        return 0;
    if (outputName === 'loop')
        return 1;
    if (outputName === 'error')
        return 0;
    const outputMatch = outputName.match(/^output(\d+)$/);
    if (outputMatch) {
        return parseInt(outputMatch[1], 10);
    }
    const caseMatch = outputName.match(/^case(\d+)$/);
    if (caseMatch) {
        return parseInt(caseMatch[1], 10);
    }
    return 0;
}
function getOutputSlotName(outputIndex, isSwitch = false) {
    return isSwitch ? `case${outputIndex}` : `output${outputIndex}`;
}
function getAllFirstOutputTargets(node) {
    for (const [outputName, connections] of node.outputs) {
        if (outputName === 'error')
            continue;
        if (connections.length > 0) {
            return connections.map((c) => c.target);
        }
    }
    return [];
}
function hasErrorOutput(node) {
    if (node.json.onError === 'continueErrorOutput')
        return true;
    const errorConnections = node.outputs.get('error');
    return !!errorConnections && errorConnections.length > 0;
}
function getErrorOutputTargets(node) {
    const errorConnections = node.outputs.get('error');
    if (!errorConnections || errorConnections.length === 0) {
        return [];
    }
    return errorConnections.map((c) => c.target);
}
//# sourceMappingURL=build-utils.js.map