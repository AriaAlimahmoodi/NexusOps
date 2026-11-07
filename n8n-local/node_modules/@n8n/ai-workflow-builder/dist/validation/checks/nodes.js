"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNodes = validateNodes;
const node_type_map_1 = require("../../validation/utils/node-type-map");
function validateNodes(workflow, nodeTypes) {
    const violations = [];
    if (!workflow.nodes || workflow.nodes.length === 0) {
        violations.push({
            name: 'workflow-has-no-nodes',
            type: 'critical',
            description: 'Workflow has no nodes',
            pointsDeducted: 50,
        });
        return violations;
    }
    const { nodeTypeMap, nodeTypesByName } = (0, node_type_map_1.createNodeTypeMaps)(nodeTypes);
    const nodeCountByType = new Map();
    for (const node of workflow.nodes) {
        const currentCount = nodeCountByType.get(node.type) ?? 0;
        nodeCountByType.set(node.type, currentCount + 1);
    }
    const checkedTypes = new Set();
    for (const node of workflow.nodes) {
        if (checkedTypes.has(node.type)) {
            continue;
        }
        checkedTypes.add(node.type);
        const nodeType = (0, node_type_map_1.getNodeTypeForNode)(node, nodeTypeMap, nodeTypesByName);
        if (!nodeType?.maxNodes) {
            continue;
        }
        const count = nodeCountByType.get(node.type) ?? 0;
        if (count > nodeType.maxNodes) {
            violations.push({
                name: 'workflow-exceeds-max-nodes-limit',
                type: 'critical',
                description: `Workflow can only have ${nodeType.maxNodes} ${nodeType.displayName} node(s), but found ${count}`,
                pointsDeducted: 50,
            });
        }
    }
    return violations;
}
//# sourceMappingURL=nodes.js.map