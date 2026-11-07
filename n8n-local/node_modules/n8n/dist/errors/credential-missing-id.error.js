"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialMissingIdError = void 0;
const errors_1 = require("@n8n/errors");
class CredentialMissingIdError extends errors_1.UnexpectedError {
    constructor(credentialName, credentialType) {
        super('Found credential with no ID.', {
            extra: { credentialName },
            tags: { credentialType },
        });
    }
}
exports.CredentialMissingIdError = CredentialMissingIdError;
//# sourceMappingURL=credential-missing-id.error.js.map