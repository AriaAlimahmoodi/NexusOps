"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDeactivationBadRequestError = void 0;
const errors_1 = require("@n8n/errors");
class WorkflowDeactivationBadRequestError extends errors_1.BadRequestError {
    constructor(message, meta = {}) {
        super(message);
        this.meta = meta;
        this.name = 'WorkflowDeactivationBadRequestError';
    }
}
exports.WorkflowDeactivationBadRequestError = WorkflowDeactivationBadRequestError;
//# sourceMappingURL=workflow-deactivation-bad-request.error.js.map