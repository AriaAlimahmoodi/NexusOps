"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresLiveRowsRetrievalError = void 0;
const errors_1 = require("@n8n/errors");
class PostgresLiveRowsRetrievalError extends errors_1.UnexpectedError {
    constructor(rows) {
        super('Failed to retrieve live execution rows in Postgres', { extra: { rows } });
    }
}
exports.PostgresLiveRowsRetrievalError = PostgresLiveRowsRetrievalError;
//# sourceMappingURL=postgres-live-rows-retrieval.error.js.map