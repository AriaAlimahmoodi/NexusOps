"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuedExecutionRetryError = void 0;
const errors_1 = require("@n8n/errors");
class QueuedExecutionRetryError extends errors_1.UnexpectedError {
    constructor() {
        super('Execution is queued to run (not yet started) so it cannot be retried');
    }
}
exports.QueuedExecutionRetryError = QueuedExecutionRetryError;
//# sourceMappingURL=queued-execution-retry.error.js.map