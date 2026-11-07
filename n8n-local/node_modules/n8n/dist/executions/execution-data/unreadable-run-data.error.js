"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnreadableRunDataError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class UnreadableRunDataError extends n8n_workflow_1.UnexpectedError {
    constructor(ref) {
        super('Execution data bundle carries no readable run data', { extra: { ...ref } });
    }
}
exports.UnreadableRunDataError = UnreadableRunDataError;
//# sourceMappingURL=unreadable-run-data.error.js.map