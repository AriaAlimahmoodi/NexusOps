"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialNotFoundError = void 0;
const errors_1 = require("@n8n/errors");
class CredentialNotFoundError extends errors_1.UserError {
    constructor(credentialId, credentialType) {
        super(credentialType
            ? `Credential with ID "${credentialId}" does not exist for type "${credentialType}".`
            : `Credential with ID "${credentialId}" was not found.`);
    }
}
exports.CredentialNotFoundError = CredentialNotFoundError;
//# sourceMappingURL=credential-not-found.error.js.map