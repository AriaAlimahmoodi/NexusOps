"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierValidationError = void 0;
const credential_resolution_error_1 = require("../../errors/credential-resolution.error");
class IdentifierValidationError extends credential_resolution_error_1.CredentialResolutionError {
    constructor(message, options) {
        super(message, options);
        this.name = 'IdentifierValidationError';
    }
}
exports.IdentifierValidationError = IdentifierValidationError;
//# sourceMappingURL=identifier-interface.js.map