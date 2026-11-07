"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScimInvalidValueError = exports.ScimInvalidFilterError = exports.ScimConflictError = exports.ScimResourceNotFoundError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class ScimResourceNotFoundError extends n8n_workflow_1.UserError {
    constructor(resourceId) {
        super(`Resource ${resourceId} not found`);
    }
}
exports.ScimResourceNotFoundError = ScimResourceNotFoundError;
class ScimConflictError extends n8n_workflow_1.UserError {
    constructor(detail) {
        super(detail);
    }
}
exports.ScimConflictError = ScimConflictError;
class ScimInvalidFilterError extends n8n_workflow_1.UserError {
    constructor(filter) {
        super(`Unsupported filter expression: ${filter}`);
    }
}
exports.ScimInvalidFilterError = ScimInvalidFilterError;
class ScimInvalidValueError extends n8n_workflow_1.UserError {
    constructor(detail) {
        super(detail);
    }
}
exports.ScimInvalidValueError = ScimInvalidValueError;
//# sourceMappingURL=scim.errors.js.map