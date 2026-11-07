"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeduplicationError = void 0;
const errors_1 = require("@n8n/errors");
class DeduplicationError extends errors_1.UnexpectedError {
    constructor(message) {
        super(`Deduplication Failed: ${message}`);
    }
}
exports.DeduplicationError = DeduplicationError;
//# sourceMappingURL=deduplication.error.js.map