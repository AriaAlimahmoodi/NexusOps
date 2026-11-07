"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConnections = validateConnections;
const n8n_workflow_1 = require("n8n-workflow");
const data_table_helpers_1 = require("../../utils/data-table-helpers");
const node_helpers_1 = require("../../utils/node-helpers");
const node_type_map_1 = require("../../validation/utils/node-type-map");
const resolve_connections_1 = require("../../validation/utils/resolve-connections");
function getProvidedInputTypes(nodeConnections) {
    const providedInputTypes = new Map();
    if (!nodeConnections)
        return providedInputTypes;
    for (const [connectionType, connections] of Object.entries(nodeConnections)) {
        let totalConnections = 0;
        for (const connectionSet of connections) {
            if (!connectionSet)
                continue;
            totalConnections += connectionSet.length;
        }
        if (totalConnections > 0) {
            providedInputTypes.set(connectionType, totalConnections);
        }
    }
    return providedInputTypes;
}
function checkMissingRequiredInputs(nodeInfo, providedInputTypes) {
    const issues = [];
    if (!nodeInfo.resolvedInputs)
        return issues;
    for (const input of nodeInfo.resolvedInputs) {
        const providedCount = providedInputTypes.get(input.type) ?? 0;
        if (input.required && providedCount === 0) {
            issues.push({
                name: 'node-missing-required-input',
                type: 'critical',
                description: `Node ${nodeInfo.node.name} (${nodeInfo.node.type}) is missing required input of type ${input.type}`,
                pointsDeducted: 50,
                metadata: {
                    nodeName: nodeInfo.node.name,
                    nodeType: nodeInfo.node.type,
                    missingType: input.type,
                },
            });
        }
    }
    return issues;
}
function checkUnsupportedConnections(nodeInfo, providedInputTypes) {
    const issues = [];
    if (!nodeInfo.resolvedInputs)
        return issues;
    const supportedTypes = new Set(nodeInfo.resolvedInputs.map((input) => input.type));
    for (const [type] of providedInputTypes) {
        if (!supportedTypes.has(type)) {
            issues.push({
                name: 'node-unsupported-connection-input',
                type: 'critical',
                description: `Node ${nodeInfo.node.name} (${nodeInfo.node.type}) received unsupported connection type ${type}`,
                pointsDeducted: 50,
            });
        }
    }
    return issues;
}
function checkMergeNodeConnections(nodeInfo, nodeConnections) {
    const issues = [];
    if (/\.merge$/.test(nodeInfo.node.type)) {
        const numberInputsParam = nodeInfo.node.parameters?.numberInputs;
        const expectedInputs = typeof numberInputsParam === 'number' ? numberInputsParam : 2;
        const mainConnections = nodeConnections?.main ?? [];
        const connectedSlots = mainConnections.filter((slot) => Array.isArray(slot) && slot.length > 0).length;
        if (connectedSlots < 2) {
            issues.push({
                name: 'node-merge-single-input',
                type: 'major',
                description: `Merge node ${nodeInfo.node.name} has only ${connectedSlots} input connection(s). Merge nodes require at least 2 inputs to function properly.`,
                pointsDeducted: 20,
            });
        }
        const missingIndexes = [];
        for (let inputIndex = 0; inputIndex < expectedInputs; inputIndex++) {
            const connectionsForIndex = mainConnections[inputIndex];
            const hasConnections = Array.isArray(connectionsForIndex) && connectionsForIndex.length > 0;
            if (!hasConnections) {
                missingIndexes.push(inputIndex + 1);
            }
        }
        if (missingIndexes.length > 0) {
            issues.push({
                name: 'node-merge-missing-input',
                type: 'major',
                description: `Merge node ${nodeInfo.node.name} is missing connections for input(s) ${missingIndexes.join(', ')}.`,
                pointsDeducted: 20,
            });
        }
    }
    return issues;
}
function checkDataTableHasSetNodePredecessor(connectionsByDestination, node, nodesByName) {
    if (node.type !== data_table_helpers_1.DATA_TABLE_NODE_TYPE) {
        return [];
    }
    const operationParam = node.parameters?.operation;
    const operation = typeof operationParam === 'string' ? operationParam : 'insert';
    if (!(0, data_table_helpers_1.isDataTableRowColumnOperation)(operation)) {
        return [];
    }
    const predecessors = (0, n8n_workflow_1.getParentNodes)(connectionsByDestination, node.name, n8n_workflow_1.NodeConnectionTypes.Main, 1);
    const hasSetNodePredecessor = predecessors.some((name) => nodesByName.get(name)?.type === data_table_helpers_1.SET_NODE_TYPE);
    if (hasSetNodePredecessor) {
        return [];
    }
    return [
        {
            name: 'data-table-missing-set-node',
            type: 'major',
            description: `Data Table node "${node.name}" uses "${operation}" operation and should have a Set node (Edit Fields) immediately before it to define the columns. Add a Set node and connect it to the Data Table.`,
            pointsDeducted: 20,
        },
    ];
}
function checkSubNodeRootConnections(workflow, nodeInfo, nodesByName) {
    const issues = [];
    const { node, nodeType, resolvedOutputs } = nodeInfo;
    if (!resolvedOutputs || resolvedOutputs.size === 0) {
        return issues;
    }
    if (!(0, node_helpers_1.isSubNode)(nodeType, node)) {
        return issues;
    }
    const aiOutputs = Array.from(resolvedOutputs).filter((output) => output.startsWith('ai_'));
    if (aiOutputs.length === 0) {
        return issues;
    }
    const nodeConnections = workflow.connections?.[node.name];
    for (const outputType of aiOutputs) {
        const connectionsForType = nodeConnections?.[outputType];
        const hasRootConnection = connectionsForType?.some((connectionGroup) => connectionGroup?.some((connection) => connection?.node && nodesByName.has(connection.node)));
        if (!hasRootConnection) {
            issues.push({
                name: 'sub-node-not-connected',
                type: 'critical',
                description: `Sub-node ${node.name} (${node.type}) provides ${outputType} but is not connected to a root node.`,
                pointsDeducted: 50,
                metadata: {
                    nodeName: node.name,
                    nodeType: node.type,
                    outputType,
                },
            });
        }
    }
    return issues;
}
function validateConnections(workflow, nodeTypes) {
    const violations = [];
    if (!workflow.connections) {
        workflow.connections = {};
    }
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(workflow.connections);
    const nodesByName = new Map(workflow.nodes.map((node) => [node.name, node]));
    const { nodeTypeMap, nodeTypesByName } = (0, node_type_map_1.createNodeTypeMaps)(nodeTypes);
    for (const node of workflow.nodes) {
        const nodeType = (0, node_type_map_1.getNodeTypeForNode)(node, nodeTypeMap, nodeTypesByName);
        if (!nodeType) {
            violations.push({
                name: 'node-type-not-found',
                type: 'critical',
                description: `Node type ${node.type} not found for node ${node.name}`,
                pointsDeducted: 50,
            });
            continue;
        }
        const nodeInfo = { node, nodeType };
        try {
            nodeInfo.resolvedInputs = (0, resolve_connections_1.resolveNodeInputs)(nodeInfo);
            nodeInfo.resolvedOutputs = (0, resolve_connections_1.resolveNodeOutputs)(nodeInfo);
        }
        catch (error) {
            violations.push({
                name: 'failed-to-resolve-connections',
                type: 'critical',
                description: `Failed to resolve connections for node ${node.name} (${node.type}): ${error instanceof Error ? error.message : String(error)}`,
                pointsDeducted: 50,
            });
            continue;
        }
        const nodeConnections = connectionsByDestination[node.name];
        const providedInputTypes = getProvidedInputTypes(nodeConnections);
        violations.push(...checkMissingRequiredInputs(nodeInfo, providedInputTypes));
        violations.push(...checkUnsupportedConnections(nodeInfo, providedInputTypes));
        violations.push(...checkMergeNodeConnections(nodeInfo, nodeConnections));
        violations.push(...checkSubNodeRootConnections(workflow, nodeInfo, nodesByName));
        violations.push(...checkDataTableHasSetNodePredecessor(connectionsByDestination, node, nodesByName));
    }
    return violations;
}
//# sourceMappingURL=connections.js.map