"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingExecutionDataError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class MissingExecutionDataError extends n8n_workflow_1.UnexpectedError {
    constructor(ref) {
        super('Missing execution data', { extra: { ...ref } });
    }
}
exports.MissingExecutionDataError = MissingExecutionDataError;
//# sourceMappingURL=missing-execution-data.error.js.map