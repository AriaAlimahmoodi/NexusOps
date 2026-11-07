"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConnections = resolveConnections;
exports.resolveNodeOutputs = resolveNodeOutputs;
exports.resolveNodeInputs = resolveNodeInputs;
const n8n_workflow_1 = require("n8n-workflow");
function isDynamicConnectionsExpression(connections) {
    return (typeof connections === 'string' && connections.startsWith('={{') && connections.endsWith('}}'));
}
function resolveConnections(connections, parameters, nodeVersion) {
    if (Array.isArray(connections)) {
        return connections;
    }
    if (isDynamicConnectionsExpression(connections)) {
        const context = {};
        n8n_workflow_1.Expression.initializeGlobalContext(context);
        Object.assign(context, {
            $parameter: parameters,
            $nodeVersion: nodeVersion,
        });
        const result = n8n_workflow_1.Expression.resolveWithoutWorkflow(connections.substring(1), context);
        if (!Array.isArray(result)) {
            throw new Error('Expression did not resolve to an array');
        }
        return result;
    }
    throw new Error('Unable to resolve connections');
}
function resolveNodeOutputs(nodeInfo) {
    const outputTypes = new Set();
    if (!nodeInfo.nodeType.outputs) {
        return outputTypes;
    }
    const resolvedOutputs = resolveConnections(nodeInfo.nodeType.outputs, nodeInfo.node.parameters, nodeInfo.node.typeVersion || 1);
    for (const output of resolvedOutputs) {
        if (typeof output === 'string') {
            outputTypes.add(output);
        }
        else if (typeof output === 'object' && 'type' in output) {
            outputTypes.add(output.type);
        }
    }
    return outputTypes;
}
function resolveNodeInputs(nodeInfo) {
    const requiredInputs = [];
    if (!nodeInfo.nodeType.inputs) {
        return requiredInputs;
    }
    const resolvedInputs = resolveConnections(nodeInfo.nodeType.inputs, nodeInfo.node.parameters, nodeInfo.node.typeVersion || 1);
    for (const input of resolvedInputs) {
        if (typeof input === 'string') {
            requiredInputs.push({ type: input, required: input === 'main' });
        }
        else if (typeof input === 'object' && 'type' in input) {
            requiredInputs.push({
                type: input.type,
                required: input.type === 'main' ? true : (input.required ?? false),
            });
        }
    }
    return requiredInputs;
}
//# sourceMappingURL=resolve-connections.js.map