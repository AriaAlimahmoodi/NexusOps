"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTriggerLikeNodeType = isTriggerLikeNodeType;
exports.getEnabledTriggerNodes = getEnabledTriggerNodes;
const n8n_workflow_1 = require("n8n-workflow");
function isTriggerLikeNodeType(nodeType) {
    return !!nodeType.trigger || !!nodeType.poll || !!nodeType.webhook;
}
function getEnabledTriggerNodes(version, nodeTypes) {
    if (!version)
        return [];
    const workflow = new n8n_workflow_1.Workflow({
        id: 'trigger-diff',
        name: 'trigger-diff',
        nodes: version.nodes,
        connections: version.connections,
        active: false,
        nodeTypes,
    });
    return workflow.queryNodes(isTriggerLikeNodeType);
}
//# sourceMappingURL=enabled-trigger-nodes.js.map