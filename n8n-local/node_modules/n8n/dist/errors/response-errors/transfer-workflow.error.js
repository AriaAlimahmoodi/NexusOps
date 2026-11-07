"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferWorkflowError = void 0;
const errors_1 = require("@n8n/errors");
class TransferWorkflowError extends errors_1.ResponseError {
    constructor(message) {
        super(message, 400, 400);
    }
}
exports.TransferWorkflowError = TransferWorkflowError;
//# sourceMappingURL=transfer-workflow.error.js.map