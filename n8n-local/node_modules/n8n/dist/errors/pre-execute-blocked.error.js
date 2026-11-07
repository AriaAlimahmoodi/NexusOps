"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreExecuteBlockedError = void 0;
const errors_1 = require("@n8n/errors");
class PreExecuteBlockedError extends errors_1.UserError {
    constructor(cause) {
        super(cause.message, { cause });
        this.cause = cause;
    }
    static unwrap(error) {
        return error instanceof PreExecuteBlockedError ? error.cause : error;
    }
}
exports.PreExecuteBlockedError = PreExecuteBlockedError;
//# sourceMappingURL=pre-execute-blocked.error.js.map