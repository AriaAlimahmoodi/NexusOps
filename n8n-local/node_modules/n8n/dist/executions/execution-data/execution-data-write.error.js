"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionDataWriteError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class ExecutionDataWriteError extends n8n_workflow_1.UnexpectedError {
    constructor(ref, cause) {
        super('Failed to write execution data', { extra: { ...ref }, cause });
    }
}
exports.ExecutionDataWriteError = ExecutionDataWriteError;
//# sourceMappingURL=execution-data-write.error.js.map