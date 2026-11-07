"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTriggerNodeType = isTriggerNodeType;
exports.isSubNode = isSubNode;
const n8n_workflow_1 = require("n8n-workflow");
function isTriggerNodeType(nodeType) {
    const lower = nodeType.toLowerCase();
    return (lower.includes('trigger') ||
        lower.includes('webhook') ||
        nodeType === 'n8n-nodes-base.manualTrigger');
}
function isSubNode(nodeType, node) {
    if (node?.parameters?.mode === 'retrieve-as-tool') {
        return true;
    }
    if (nodeType.name === '@n8n/n8n-nodes-langchain.agent') {
        return false;
    }
    if (!nodeType.inputs || (Array.isArray(nodeType.inputs) && nodeType.inputs.length === 0)) {
        return true;
    }
    if (Array.isArray(nodeType.inputs)) {
        const hasMainInput = nodeType.inputs.some((input) => {
            if (typeof input === 'string') {
                return input === n8n_workflow_1.NodeConnectionTypes.Main || input.toLowerCase() === 'main';
            }
            return input.type === n8n_workflow_1.NodeConnectionTypes.Main || input.type.toLowerCase() === 'main';
        });
        return !hasMainInput;
    }
    if (typeof nodeType.inputs === 'string') {
        const mainInputPatterns = [
            'NodeConnectionTypes.Main',
            'type: "main"',
            "type: 'main'",
            'type:"main"',
            "type:'main'",
            'type: `main`',
            'type: NodeConnectionTypes.Main',
            'type:NodeConnectionTypes.Main',
            '{ displayName: "", type: "main"',
            "{ displayName: '', type: 'main'",
            '{ displayName: "", type: NodeConnectionTypes.Main',
            "{ displayName: '', type: NodeConnectionTypes.Main",
            'return ["main"',
            "return ['main'",
            'return [`main`',
            'return[["main"',
            "return[['main'",
            'return [[`main`',
            '["main", ...',
            "['main', ...",
            '[`main`, ...',
        ];
        const hasMainInput = mainInputPatterns.some((pattern) => typeof nodeType.inputs === 'string' &&
            nodeType.inputs.toLowerCase().includes(pattern.toLowerCase()));
        return !hasMainInput;
    }
    return false;
}
//# sourceMappingURL=node-helpers.js.map