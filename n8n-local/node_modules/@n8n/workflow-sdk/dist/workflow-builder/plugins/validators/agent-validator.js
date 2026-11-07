"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentValidator = void 0;
const validation_helpers_1 = require("../../validation-helpers");
exports.agentValidator = {
    id: 'core:agent',
    name: 'Agent Validator',
    nodeTypes: ['@n8n/n8n-nodes-langchain.agent'],
    priority: 50,
    validateNode(node, _graphNode, _ctx) {
        const issues = [];
        const params = node.config?.parameters;
        if (!params) {
            return issues;
        }
        const promptType = params.promptType;
        if (!promptType || promptType === 'auto' || promptType === 'guardrails') {
            return issues;
        }
        const text = params.text;
        const hasValidExpression = (0, validation_helpers_1.containsExpression)(text);
        const hasMalformedExpression = (0, validation_helpers_1.containsMalformedExpression)(text);
        if (!text || (!hasValidExpression && !hasMalformedExpression)) {
            issues.push({
                code: 'AGENT_STATIC_PROMPT',
                message: `Is input data required for '${node.name}'? If so, add an expression to the prompt. When following a chat trigger node, use { promptType: 'auto', text: '={{ $json.chatInput }}' }. Or use { promptType: 'define', text: '={{ ... }}' } to add dynamic data like input data.`,
                severity: 'warning',
                nodeName: node.name,
            });
        }
        const options = params.options;
        const systemMessage = options?.systemMessage ?? params.systemMessage;
        if (!systemMessage ||
            (typeof systemMessage === 'string' && systemMessage.trim().length === 0)) {
            issues.push({
                code: 'AGENT_NO_SYSTEM_MESSAGE',
                message: `'${node.name}' has no system message. System-level instructions should be in the system message field.`,
                severity: 'warning',
                nodeName: node.name,
            });
        }
        return issues;
    },
};
//# sourceMappingURL=agent-validator.js.map