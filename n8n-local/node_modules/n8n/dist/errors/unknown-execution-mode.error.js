"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownExecutionModeError = void 0;
const errors_1 = require("@n8n/errors");
class UnknownExecutionModeError extends errors_1.UnexpectedError {
    constructor(mode) {
        super('Unknown execution mode', { extra: { mode } });
    }
}
exports.UnknownExecutionModeError = UnknownExecutionModeError;
//# sourceMappingURL=unknown-execution-mode.error.js.map