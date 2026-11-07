"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNodeExists = validateNodeExists;
exports.findNodeByName = findNodeByName;
exports.findNodeByIdOrName = findNodeByIdOrName;
exports.findNodeType = findNodeType;
exports.validateConnection = validateConnection;
exports.createValidationError = createValidationError;
exports.createNodeNotFoundError = createNodeNotFoundError;
exports.createNodeTypeNotFoundError = createNodeTypeNotFoundError;
exports.createNodeParameterTooLargeError = createNodeParameterTooLargeError;
exports.hasNodes = hasNodes;
const errors_1 = require("../../errors");
function validateNodeExists(nodeId, nodes) {
    return nodes.find((n) => n.id === nodeId) ?? null;
}
function findNodeByName(nodeName, nodes) {
    return nodes.find((n) => n.name.toLowerCase() === nodeName.toLowerCase()) ?? null;
}
function findNodeByIdOrName(nodeIdentifier, nodes) {
    const byId = validateNodeExists(nodeIdentifier, nodes);
    if (byId)
        return byId;
    return findNodeByName(nodeIdentifier, nodes);
}
function findNodeType(nodeTypeName, nodeVersion, nodeTypes) {
    return (nodeTypes.find((nt) => nt.name === nodeTypeName &&
        (Array.isArray(nt.version) ? nt.version.includes(nodeVersion) : nt.version === nodeVersion)) ?? null);
}
function validateConnection(sourceNode, targetNode) {
    if (sourceNode.id === targetNode.id) {
        const error = new errors_1.ConnectionError('Cannot connect a node to itself', {
            fromNodeId: sourceNode.id,
            toNodeId: targetNode.id,
        });
        return {
            message: error.message,
            code: 'SELF_CONNECTION',
            details: { sourceId: sourceNode.id, targetId: targetNode.id },
        };
    }
    return null;
}
function createValidationError(message, code, details) {
    const error = new errors_1.ValidationError(message, { tags: { code, ...details } });
    return {
        message: error.message,
        code,
        details,
    };
}
function createNodeNotFoundError(nodeIdentifier) {
    const error = new errors_1.NodeNotFoundError(nodeIdentifier);
    return {
        message: error.message,
        code: 'NODE_NOT_FOUND',
        details: { nodeIdentifier },
    };
}
function createNodeTypeNotFoundError(nodeTypeName) {
    const error = new errors_1.NodeTypeNotFoundError(nodeTypeName);
    return {
        message: error.message,
        code: 'NODE_TYPE_NOT_FOUND',
        details: { nodeTypeName },
    };
}
function createNodeParameterTooLargeError(nodeId, parameter, maxSize) {
    const error = new errors_1.ParameterTooLargeError('Parameter value is too large to retrieve', {
        parameter,
        nodeId,
        maxSize,
    });
    return {
        message: error.message,
        code: 'NODE_PARAMETER_TOO_LARGE',
        details: { nodeId, parameter, maxSize: maxSize.toString() },
    };
}
function hasNodes(workflow) {
    return workflow.nodes.length > 0;
}
//# sourceMappingURL=validation.js.map