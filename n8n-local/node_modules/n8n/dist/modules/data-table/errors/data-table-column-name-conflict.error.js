"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableColumnNameConflictError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class DataTableColumnNameConflictError extends n8n_workflow_1.UserError {
    constructor(columnName, dataTableName) {
        super(`Data table column with name '${columnName}' already exists in data table '${dataTableName}'`, {
            level: 'warning',
        });
    }
}
exports.DataTableColumnNameConflictError = DataTableColumnNameConflictError;
//# sourceMappingURL=data-table-column-name-conflict.error.js.map