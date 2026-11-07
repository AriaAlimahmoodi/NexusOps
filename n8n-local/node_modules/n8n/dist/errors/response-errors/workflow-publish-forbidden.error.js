"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowPublishForbiddenError = void 0;
const errors_1 = require("@n8n/errors");
const messages = {
    insufficient_api_key_scope: "Your change was saved as a draft. It wasn't published because this API key does not have the workflow:activate scope.",
    insufficient_permissions: "Your change was saved as a draft. It wasn't published because you do not have permission to publish this workflow. Ask the owner to publish it for you.",
};
class WorkflowPublishForbiddenError extends errors_1.ForbiddenError {
    constructor(details) {
        super(messages[details.reason]);
        this.details = details;
        this.meta = { ...this.details, validationError: true };
    }
}
exports.WorkflowPublishForbiddenError = WorkflowPublishForbiddenError;
//# sourceMappingURL=workflow-publish-forbidden.error.js.map