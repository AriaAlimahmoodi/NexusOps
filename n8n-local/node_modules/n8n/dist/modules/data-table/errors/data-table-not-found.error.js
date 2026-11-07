"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableNotFoundError = void 0;
const errors_1 = require("@n8n/errors");
class DataTableNotFoundError extends errors_1.NotFoundError {
    constructor(dataTableId) {
        super(`Could not find the data table: '${dataTableId}'`);
    }
}
exports.DataTableNotFoundError = DataTableNotFoundError;
//# sourceMappingURL=data-table-not-found.error.js.map