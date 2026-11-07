"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidConcurrencyLimitError = void 0;
const errors_1 = require("@n8n/errors");
class InvalidConcurrencyLimitError extends errors_1.UserError {
    constructor(value) {
        super('Concurrency limit set to invalid value', { extra: { value } });
    }
}
exports.InvalidConcurrencyLimitError = InvalidConcurrencyLimitError;
//# sourceMappingURL=invalid-concurrency-limit.error.js.map