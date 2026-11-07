"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableSystemColumnNameConflictError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class DataTableSystemColumnNameConflictError extends n8n_workflow_1.UserError {
    constructor(columnName, type = 'system') {
        super(`Column name "${columnName}" is reserved as a ${type} column name.`, {
            level: 'warning',
        });
    }
}
exports.DataTableSystemColumnNameConflictError = DataTableSystemColumnNameConflictError;
//# sourceMappingURL=data-table-system-column-name-conflict.error.js.map