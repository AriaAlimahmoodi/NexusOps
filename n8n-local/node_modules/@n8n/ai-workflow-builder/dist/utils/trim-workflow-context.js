"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimWorkflowJSON = trimWorkflowJSON;
const constants_1 = require("../constants");
const token_usage_1 = require("../utils/token-usage");
const MAX_PARAMETER_VALUE_LENGTH_THRESHOLDS = [10000, 5000, 2000, 1000];
function trimParameterValue(value, threshold) {
    if (value === undefined || value === null) {
        return value;
    }
    const valueStr = JSON.stringify(value);
    if (valueStr.length > threshold) {
        if (typeof value === 'string') {
            return '[Large value omitted]';
        }
        else if (Array.isArray(value)) {
            return '[Large array omitted]';
        }
        else if (typeof value === 'object' && value !== null) {
            return '[Large object omitted]';
        }
    }
    return value;
}
function trimWorkflowJsonWithThreshold(workflow, threshold) {
    const simplifiedWorkflow = { ...workflow };
    if (simplifiedWorkflow.nodes) {
        simplifiedWorkflow.nodes = simplifiedWorkflow.nodes.map((node) => {
            const simplifiedNode = { ...node };
            if (simplifiedNode.parameters) {
                const simplifiedParameters = {};
                for (const [key, value] of Object.entries(simplifiedNode.parameters)) {
                    simplifiedParameters[key] = trimParameterValue(value, threshold);
                }
                simplifiedNode.parameters = simplifiedParameters;
            }
            return simplifiedNode;
        });
    }
    return simplifiedWorkflow;
}
function trimWorkflowJSON(workflow) {
    for (const threshold of MAX_PARAMETER_VALUE_LENGTH_THRESHOLDS) {
        const simplified = trimWorkflowJsonWithThreshold(workflow, threshold);
        const workflowStr = JSON.stringify(simplified);
        const estimatedTokens = (0, token_usage_1.estimateTokenCountFromString)(workflowStr);
        if (estimatedTokens <= constants_1.MAX_WORKFLOW_LENGTH_TOKENS) {
            return simplified;
        }
    }
    return trimWorkflowJsonWithThreshold(workflow, MAX_PARAMETER_VALUE_LENGTH_THRESHOLDS[MAX_PARAMETER_VALUE_LENGTH_THRESHOLDS.length - 1]);
}
//# sourceMappingURL=trim-workflow-context.js.map