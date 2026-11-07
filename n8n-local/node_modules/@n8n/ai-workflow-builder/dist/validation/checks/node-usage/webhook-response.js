"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWebhookResponse = validateWebhookResponse;
const n8n_workflow_1 = require("n8n-workflow");
const WEBHOOK_NODE_TYPE = 'n8n-nodes-base.webhook';
const RESPOND_TO_WEBHOOK_NODE_TYPE = 'n8n-nodes-base.respondToWebhook';
function getResponseMode(node) {
    const responseMode = node.parameters?.responseMode;
    return typeof responseMode === 'string' ? responseMode : undefined;
}
function hasConnectedRespondToWebhook(webhookNodeName, respondToWebhookNodeNames, connections) {
    if (!connections) {
        return false;
    }
    const childNodes = (0, n8n_workflow_1.getChildNodes)(connections, webhookNodeName, 'ALL', -1);
    return childNodes.some((nodeName) => respondToWebhookNodeNames.has(nodeName));
}
function validateWebhookResponse(workflow) {
    const violations = [];
    if (!workflow.nodes || workflow.nodes.length === 0) {
        return violations;
    }
    const webhookNodes = workflow.nodes.filter((node) => node.type === WEBHOOK_NODE_TYPE);
    const respondToWebhookNodes = workflow.nodes.filter((node) => node.type === RESPOND_TO_WEBHOOK_NODE_TYPE);
    const respondToWebhookNodeNames = new Set(respondToWebhookNodes.map((node) => node.name));
    for (const webhookNode of webhookNodes) {
        const responseMode = getResponseMode(webhookNode);
        const hasConnectedResponder = hasConnectedRespondToWebhook(webhookNode.name, respondToWebhookNodeNames, workflow.connections);
        if (responseMode === 'responseNode' && !hasConnectedResponder) {
            violations.push({
                name: 'webhook-response-mode-missing-respond-node',
                type: 'critical',
                description: `Webhook node "${webhookNode.name}" has responseMode='responseNode' but no "Respond to Webhook" node is connected downstream. Either add and connect a "Respond to Webhook" node or change the response mode to 'onReceived' or 'lastNode'.`,
                pointsDeducted: 50,
                metadata: {
                    webhookNodeName: webhookNode.name,
                    webhookNodeId: webhookNode.id,
                },
            });
        }
        if (hasConnectedResponder && responseMode !== 'responseNode') {
            violations.push({
                name: 'webhook-response-mode-mismatch',
                type: 'critical',
                description: `Webhook "${webhookNode.name}" has a "Respond to Webhook" node connected downstream but responseMode='${responseMode ?? 'undefined'}'. The responseMode must be 'responseNode' for the Respond to Webhook node to work.`,
                pointsDeducted: 50,
                metadata: {
                    webhookNodeName: webhookNode.name,
                    webhookNodeId: webhookNode.id,
                    currentResponseMode: responseMode ?? 'undefined',
                },
            });
        }
    }
    return violations;
}
//# sourceMappingURL=webhook-response.js.map