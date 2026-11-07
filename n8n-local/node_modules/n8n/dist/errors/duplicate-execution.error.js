"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateExecutionError = void 0;
const errors_1 = require("@n8n/errors");
class DuplicateExecutionError extends errors_1.OperationalError {
    constructor(deduplicationKey, cause) {
        super(`Execution with deduplication key "${deduplicationKey}" already exists`, {
            cause,
        });
        this.deduplicationKey = deduplicationKey;
    }
}
exports.DuplicateExecutionError = DuplicateExecutionError;
//# sourceMappingURL=duplicate-execution.error.js.map