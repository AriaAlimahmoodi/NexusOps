"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableColumnNotFoundError = void 0;
const errors_1 = require("@n8n/errors");
class DataTableColumnNotFoundError extends errors_1.NotFoundError {
    constructor(dataTableId, columnId) {
        super(`Could not find the column '${columnId}' in the data table: ${dataTableId}`);
    }
}
exports.DataTableColumnNotFoundError = DataTableColumnNotFoundError;
//# sourceMappingURL=data-table-column-not-found.error.js.map