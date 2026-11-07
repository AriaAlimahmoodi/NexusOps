"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidMfaRecoveryCodeError = void 0;
const errors_1 = require("@n8n/errors");
class InvalidMfaRecoveryCodeError extends errors_1.ForbiddenError {
    constructor(hint) {
        super('Invalid MFA recovery code', hint);
    }
}
exports.InvalidMfaRecoveryCodeError = InvalidMfaRecoveryCodeError;
//# sourceMappingURL=invalid-mfa-recovery-code-error.js.map