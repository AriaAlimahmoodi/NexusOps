"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainLlmValidator = void 0;
const string_utils_1 = require("../../string-utils");
const validation_helpers_1 = require("../../validation-helpers");
exports.chainLlmValidator = {
    id: 'core:chain-llm',
    name: 'Chain LLM Validator',
    nodeTypes: ['@n8n/n8n-nodes-langchain.chainLlm'],
    priority: 50,
    validateNode(node, _graphNode, _ctx) {
        const issues = [];
        const version = (0, string_utils_1.parseVersion)(node.version);
        if (version < 1.4) {
            return issues;
        }
        const params = node.config?.parameters;
        if (!params) {
            return issues;
        }
        const promptType = params.promptType;
        if (promptType !== 'define') {
            return issues;
        }
        const text = params.text;
        const hasValidExpression = (0, validation_helpers_1.containsExpression)(text);
        const hasMalformedExpression = (0, validation_helpers_1.containsMalformedExpression)(text);
        if (!text || (!hasValidExpression && !hasMalformedExpression)) {
            issues.push({
                code: 'AGENT_STATIC_PROMPT',
                message: `'${node.name}' has no expression in its prompt. Parameter values must start with '=' to evaluate correctly as expressions. For example '={{ $json.input }}'.`,
                severity: 'warning',
                nodeName: node.name,
            });
        }
        return issues;
    },
};
//# sourceMappingURL=chain-llm-validator.js.map