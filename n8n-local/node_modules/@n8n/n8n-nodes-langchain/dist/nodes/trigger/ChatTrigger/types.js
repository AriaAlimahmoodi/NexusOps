"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertValidLoadPreviousSessionOption = assertValidLoadPreviousSessionOption;
const n8n_workflow_1 = require("n8n-workflow");
const validOptions = ['notSupported', 'memory', 'manually'];
function isValidLoadPreviousSessionOption(value) {
    return typeof value === 'string' && validOptions.includes(value);
}
function assertValidLoadPreviousSessionOption(value, node) {
    if (value && !isValidLoadPreviousSessionOption(value)) {
        throw new n8n_workflow_1.NodeOperationError(node, `Invalid loadPreviousSession option: ${value}`);
    }
}
//# sourceMappingURL=types.js.map