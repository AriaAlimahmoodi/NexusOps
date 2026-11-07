"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentWorkflow = getCurrentWorkflow;
exports.getWorkflowState = getWorkflowState;
exports.getCurrentWorkflowFromTaskInput = getCurrentWorkflowFromTaskInput;
exports.getEffectiveWorkflow = getEffectiveWorkflow;
exports.updateWorkflowConnections = updateWorkflowConnections;
exports.addNodeToWorkflow = addNodeToWorkflow;
exports.addNodesToWorkflow = addNodesToWorkflow;
exports.removeNodeFromWorkflow = removeNodeFromWorkflow;
exports.removeNodesFromWorkflow = removeNodesFromWorkflow;
exports.updateNodeInWorkflow = updateNodeInWorkflow;
exports.addConnectionToWorkflow = addConnectionToWorkflow;
exports.removeConnectionFromWorkflow = removeConnectionFromWorkflow;
exports.renameNodeInWorkflow = renameNodeInWorkflow;
const langgraph_1 = require("@langchain/langgraph");
const operations_processor_1 = require("../../utils/operations-processor");
function getCurrentWorkflow(state) {
    return state.workflowJSON;
}
function getWorkflowState() {
    return (0, langgraph_1.getCurrentTaskInput)();
}
function getCurrentWorkflowFromTaskInput() {
    const state = getWorkflowState();
    return getCurrentWorkflow(state);
}
function getEffectiveWorkflow() {
    const state = getWorkflowState();
    const pending = state.workflowOperations;
    if (!pending || pending.length === 0) {
        return state.workflowJSON;
    }
    return (0, operations_processor_1.applyOperations)(structuredClone(state.workflowJSON), pending);
}
function updateWorkflowConnections(connections) {
    return {
        workflowOperations: [{ type: 'mergeConnections', connections }],
    };
}
function addNodeToWorkflow(node) {
    return addNodesToWorkflow([node]);
}
function addNodesToWorkflow(nodes) {
    return {
        workflowOperations: [{ type: 'addNodes', nodes }],
    };
}
function removeNodeFromWorkflow(nodeId) {
    return {
        workflowOperations: [{ type: 'removeNode', nodeIds: [nodeId] }],
    };
}
function removeNodesFromWorkflow(nodeIds) {
    return {
        workflowOperations: [{ type: 'removeNode', nodeIds }],
    };
}
function updateNodeInWorkflow(state, nodeId, updates) {
    const existingNode = state.workflowJSON.nodes.find((n) => n.id === nodeId);
    if (!existingNode) {
        return {};
    }
    return {
        workflowOperations: [{ type: 'updateNode', nodeId, updates }],
    };
}
function addConnectionToWorkflow(sourceNodeId, _targetNodeId, connection) {
    return {
        workflowOperations: [
            {
                type: 'mergeConnections',
                connections: {
                    [sourceNodeId]: {
                        main: [[connection]],
                    },
                },
            },
        ],
    };
}
function removeConnectionFromWorkflow(sourceNode, targetNode, connectionType, sourceOutputIndex, targetInputIndex) {
    return {
        workflowOperations: [
            {
                type: 'removeConnection',
                sourceNode,
                targetNode,
                connectionType,
                sourceOutputIndex,
                targetInputIndex,
            },
        ],
    };
}
function renameNodeInWorkflow(nodeId, oldName, newName) {
    return {
        workflowOperations: [{ type: 'renameNode', nodeId, oldName, newName }],
    };
}
//# sourceMappingURL=state.js.map