"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateMethodValidator = void 0;
const validation_helpers_1 = require("../../validation-helpers");
exports.dateMethodValidator = {
    id: 'core:date-method',
    name: 'Date Method Validator',
    priority: 30,
    validateNode(node, _graphNode, _ctx) {
        const issues = [];
        const params = node.config?.parameters;
        if (!params) {
            return issues;
        }
        const dateIssues = (0, validation_helpers_1.findInvalidDateMethods)(params);
        for (const { path } of dateIssues) {
            issues.push({
                code: 'INVALID_DATE_METHOD',
                message: `'${node.name}' parameter "${path}" uses .toISOString() which is a JS Date method. Use .toISO() for Luxon DateTime ($now, $today).`,
                severity: 'warning',
                nodeName: node.name,
                parameterPath: path,
            });
        }
        return issues;
    },
};
//# sourceMappingURL=date-method-validator.js.map