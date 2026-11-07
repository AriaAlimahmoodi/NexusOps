"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromAiValidator = void 0;
const validation_helpers_1 = require("../../validation-helpers");
exports.fromAiValidator = {
    id: 'core:from-ai',
    name: 'FromAI Expression Validator',
    priority: 50,
    validateNode(node, _graphNode, _ctx) {
        const issues = [];
        if ((0, validation_helpers_1.isToolNode)(node.type)) {
            return issues;
        }
        const params = node.config?.parameters;
        if (!params) {
            return issues;
        }
        if ((0, validation_helpers_1.containsFromAI)(params)) {
            issues.push({
                code: 'FROM_AI_IN_NON_TOOL',
                message: `'${node.name}' uses $fromAI() which is only valid in tool nodes connected to an AI agent.`,
                severity: 'warning',
                violationLevel: 'major',
                nodeName: node.name,
            });
        }
        return issues;
    },
};
//# sourceMappingURL=from-ai-validator.js.map