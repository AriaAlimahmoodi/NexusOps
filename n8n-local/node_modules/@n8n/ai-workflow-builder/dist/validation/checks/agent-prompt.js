"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgentPrompt = validateAgentPrompt;
const expressions_1 = require("../utils/expressions");
function isOptionsWithSystemMessage(value) {
    return (typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        ('systemMessage' in value || Object.keys(value).length === 0));
}
function validateAgentPrompt(workflow) {
    const violations = [];
    if (!workflow.nodes || workflow.nodes.length === 0) {
        return [];
    }
    for (const node of workflow.nodes) {
        if (node.type === '@n8n/n8n-nodes-langchain.agent') {
            const textParam = node.parameters?.text;
            const promptType = node.parameters?.promptType;
            const options = node.parameters?.options;
            let systemMessage;
            if (isOptionsWithSystemMessage(options)) {
                systemMessage = options.systemMessage;
            }
            if (promptType !== 'auto' && promptType !== 'guardrails') {
                if (!textParam || !(0, expressions_1.containsExpression)(textParam)) {
                    violations.push({
                        name: 'agent-static-prompt',
                        type: 'major',
                        description: `Agent node "${node.name}" has no expression in its prompt field. This likely means it failed to use chatInput or dynamic context`,
                        pointsDeducted: 20,
                    });
                }
                if (!systemMessage || systemMessage.trim().length === 0) {
                    violations.push({
                        name: 'agent-no-system-prompt',
                        type: 'major',
                        description: `Agent node "${node.name}" has no system message. System-level instructions (role, tasks, behavior) should be in the system message field, not the text field`,
                        pointsDeducted: 25,
                    });
                }
            }
        }
    }
    return violations;
}
//# sourceMappingURL=agent-prompt.js.map