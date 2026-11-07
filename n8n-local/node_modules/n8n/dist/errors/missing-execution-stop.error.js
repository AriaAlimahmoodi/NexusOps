"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingExecutionStopError = void 0;
const errors_1 = require("@n8n/errors");
class MissingExecutionStopError extends errors_1.UserError {
    constructor(executionId) {
        super('Failed to find execution to stop', { extra: { executionId } });
    }
}
exports.MissingExecutionStopError = MissingExecutionStopError;
//# sourceMappingURL=missing-execution-stop.error.js.map