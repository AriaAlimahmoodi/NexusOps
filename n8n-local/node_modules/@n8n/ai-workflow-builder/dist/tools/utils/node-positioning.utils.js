"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSITIONING_CONFIG = void 0;
exports.calculateNodePosition = calculateNodePosition;
exports.categorizeNodes = categorizeNodes;
exports.getNodesAtPosition = getNodesAtPosition;
exports.calculateConnectedNodePosition = calculateConnectedNodePosition;
const node_helpers_1 = require("../../utils/node-helpers");
exports.POSITIONING_CONFIG = {
    HORIZONTAL_GAP: 280,
    MAIN_NODE_Y: 300,
    SUB_NODE_Y: 450,
    VERTICAL_SPACING: 120,
    INITIAL_X: 250,
    X_PROXIMITY_THRESHOLD: 50,
    SUB_NODE_HORIZONTAL_OFFSET: 0.8,
};
function calculateNodePosition(existingNodes, isSubNodeType, nodeTypes) {
    const { INITIAL_X, MAIN_NODE_Y, SUB_NODE_Y } = exports.POSITIONING_CONFIG;
    if (existingNodes.length === 0) {
        return [INITIAL_X, isSubNodeType ? SUB_NODE_Y : MAIN_NODE_Y];
    }
    const { mainNodes, subNodes } = categorizeNodes(existingNodes, nodeTypes);
    const targetX = calculateXPosition(isSubNodeType, mainNodes, subNodes);
    const targetY = calculateYPosition(targetX, existingNodes, isSubNodeType);
    return [targetX, targetY];
}
function categorizeNodes(nodes, nodeTypes) {
    const mainNodes = [];
    const subNodes = [];
    for (const node of nodes) {
        const nodeType = nodeTypes.find((nt) => nt.name === node.type);
        if (nodeType && (0, node_helpers_1.isSubNode)(nodeType, node)) {
            subNodes.push(node);
        }
        else {
            mainNodes.push(node);
        }
    }
    return { mainNodes, subNodes };
}
function calculateXPosition(isSubNodeType, mainNodes, subNodes) {
    const { HORIZONTAL_GAP, INITIAL_X, SUB_NODE_HORIZONTAL_OFFSET } = exports.POSITIONING_CONFIG;
    if (isSubNodeType) {
        if (mainNodes.length > 0) {
            const minMainX = Math.min(...mainNodes.map((n) => n.position[0]));
            return minMainX + subNodes.length * (HORIZONTAL_GAP * SUB_NODE_HORIZONTAL_OFFSET);
        }
        return INITIAL_X;
    }
    else {
        if (mainNodes.length > 0) {
            const maxMainX = Math.max(...mainNodes.map((n) => n.position[0]));
            return maxMainX + HORIZONTAL_GAP;
        }
        return INITIAL_X;
    }
}
function calculateYPosition(targetX, existingNodes, isSubNodeType) {
    const { MAIN_NODE_Y, SUB_NODE_Y, VERTICAL_SPACING, X_PROXIMITY_THRESHOLD } = exports.POSITIONING_CONFIG;
    const baseY = isSubNodeType ? SUB_NODE_Y : MAIN_NODE_Y;
    const nodesAtTargetX = existingNodes.filter((n) => Math.abs(n.position[0] - targetX) < X_PROXIMITY_THRESHOLD);
    const verticalOffset = nodesAtTargetX.length * VERTICAL_SPACING;
    return baseY + verticalOffset;
}
function getNodesAtPosition(nodes, position, tolerance = 50) {
    return nodes.filter((node) => Math.abs(node.position[0] - position[0]) < tolerance &&
        Math.abs(node.position[1] - position[1]) < tolerance);
}
function calculateConnectedNodePosition(sourceNode, isTargetSubNode, existingNodes, _nodeTypes) {
    const { HORIZONTAL_GAP, SUB_NODE_Y, VERTICAL_SPACING } = exports.POSITIONING_CONFIG;
    if (isTargetSubNode) {
        const targetX = sourceNode.position[0];
        const targetY = SUB_NODE_Y;
        const existingSubNodes = existingNodes.filter((node) => Math.abs(node.position[0] - targetX) < 50 &&
            node.position[1] >= SUB_NODE_Y &&
            node.position[1] < SUB_NODE_Y + VERTICAL_SPACING * 5);
        return [targetX, targetY + existingSubNodes.length * VERTICAL_SPACING];
    }
    else {
        const targetX = sourceNode.position[0] + HORIZONTAL_GAP;
        const targetY = sourceNode.position[1];
        const nodesAtPosition = getNodesAtPosition(existingNodes, [targetX, targetY]);
        return [targetX, targetY + nodesAtPosition.length * VERTICAL_SPACING];
    }
}
//# sourceMappingURL=node-positioning.utils.js.map