"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsExpression = containsExpression;
exports.nodeParametersContainExpression = nodeParametersContainExpression;
const n8n_workflow_1 = require("n8n-workflow");
function containsExpression(value) {
    if (!(0, n8n_workflow_1.isExpression)(value)) {
        return false;
    }
    return /\{\{[\s\S]*(?:\$\([\s\S]*?\)|\$\w+)[\s\S]*}}/.test(value);
}
function nodeParametersContainExpression(parameters) {
    for (const value of Object.values(parameters)) {
        if (containsExpression(value)) {
            return true;
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (nodeParametersContainExpression(value)) {
                return true;
            }
        }
        if (Array.isArray(value)) {
            for (const item of value) {
                if (containsExpression(item)) {
                    return true;
                }
                if (item && typeof item === 'object') {
                    if (nodeParametersContainExpression(item)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
//# sourceMappingURL=expressions.js.map