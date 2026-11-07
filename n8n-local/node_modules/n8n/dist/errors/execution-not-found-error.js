"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionNotFoundError = void 0;
const errors_1 = require("@n8n/errors");
class ExecutionNotFoundError extends errors_1.UnexpectedError {
    constructor(executionId) {
        super('No active execution found', { extra: { executionId } });
    }
}
exports.ExecutionNotFoundError = ExecutionNotFoundError;
//# sourceMappingURL=execution-not-found-error.js.map