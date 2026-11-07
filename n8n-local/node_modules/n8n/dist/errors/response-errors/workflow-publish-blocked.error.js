"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowPublishBlockedError = void 0;
const errors_1 = require("@n8n/errors");
const messages = {
    review_pending: "Workflow can't be published while its review is open. Submit this version to the review, or wait for the review to close.",
    changes_requested: "Workflow can't be published because its review has requested changes. Submit this version to the review, or wait for the review to close.",
};
class WorkflowPublishBlockedError extends errors_1.ConflictError {
    constructor(details) {
        super(messages[details.reason], undefined, {
            ...details,
            validationError: true,
        });
        this.details = details;
    }
}
exports.WorkflowPublishBlockedError = WorkflowPublishBlockedError;
//# sourceMappingURL=workflow-publish-blocked.error.js.map