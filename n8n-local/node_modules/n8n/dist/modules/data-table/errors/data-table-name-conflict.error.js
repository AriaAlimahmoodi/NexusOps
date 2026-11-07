"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableNameConflictError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class DataTableNameConflictError extends n8n_workflow_1.UserError {
    constructor(name) {
        super(`Data table with name '${name}' already exists in this project`, {
            level: 'warning',
        });
    }
}
exports.DataTableNameConflictError = DataTableNameConflictError;
//# sourceMappingURL=data-table-name-conflict.error.js.map