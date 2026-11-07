"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableAccessDeniedError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class DataTableAccessDeniedError extends n8n_workflow_1.UserError {
    constructor(action) {
        super(`You don't have the permissions to ${action} a data table in this project.`, {
            level: 'warning',
        });
    }
}
exports.DataTableAccessDeniedError = DataTableAccessDeniedError;
//# sourceMappingURL=data-table-access-denied.error.js.map