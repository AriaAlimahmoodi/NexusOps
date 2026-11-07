"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorruptedExecutionDataError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CorruptedExecutionDataError extends n8n_workflow_1.UnexpectedError {
    constructor(ref, cause) {
        super('Found corrupted execution data', { extra: { ...ref }, cause });
    }
}
exports.CorruptedExecutionDataError = CorruptedExecutionDataError;
//# sourceMappingURL=corrupted-execution-data.error.js.map