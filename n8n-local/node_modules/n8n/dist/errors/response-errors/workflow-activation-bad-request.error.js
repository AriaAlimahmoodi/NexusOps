"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowActivationBadRequestError = void 0;
const errors_1 = require("@n8n/errors");
class WorkflowActivationBadRequestError extends errors_1.BadRequestError {
    constructor(message, meta = {}) {
        super(message);
        this.meta = meta;
        this.name = 'WorkflowActivationBadRequestError';
    }
}
exports.WorkflowActivationBadRequestError = WorkflowActivationBadRequestError;
//# sourceMappingURL=workflow-activation-bad-request.error.js.map