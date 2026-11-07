"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidationError = void 0;
const workflow_activation_bad_request_error_1 = require("./workflow-activation-bad-request.error");
class WorkflowValidationError extends workflow_activation_bad_request_error_1.WorkflowActivationBadRequestError {
    constructor(message) {
        super(message);
        this.meta = { validationError: true };
        this.name = 'WorkflowValidationError';
    }
}
exports.WorkflowValidationError = WorkflowValidationError;
//# sourceMappingURL=workflow-validation.error.js.map