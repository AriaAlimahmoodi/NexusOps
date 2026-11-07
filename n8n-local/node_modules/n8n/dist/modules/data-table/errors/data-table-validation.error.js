"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableValidationError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class DataTableValidationError extends n8n_workflow_1.UserError {
    constructor(msg) {
        super(`Validation error with data table request: ${msg}`, {
            level: 'warning',
        });
    }
}
exports.DataTableValidationError = DataTableValidationError;
//# sourceMappingURL=data-table-validation.error.js.map