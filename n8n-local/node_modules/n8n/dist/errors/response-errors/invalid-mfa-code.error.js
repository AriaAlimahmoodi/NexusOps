"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidMfaCodeError = void 0;
const errors_1 = require("@n8n/errors");
class InvalidMfaCodeError extends errors_1.ForbiddenError {
    constructor(hint) {
        super('Invalid two-factor code.', hint);
    }
}
exports.InvalidMfaCodeError = InvalidMfaCodeError;
//# sourceMappingURL=invalid-mfa-code.error.js.map