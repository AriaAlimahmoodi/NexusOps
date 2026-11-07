"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nIdentityNotSupportedError = void 0;
const credential_resolution_error_1 = require("./credential-resolution.error");
class N8nIdentityNotSupportedError extends credential_resolution_error_1.CredentialResolutionError {
    constructor(credentialName) {
        super(`"${credentialName}" resolves credentials per external user, so it can only be resolved by a request carrying that user's token`);
        this.name = 'N8nIdentityNotSupportedError';
    }
}
exports.N8nIdentityNotSupportedError = N8nIdentityNotSupportedError;
//# sourceMappingURL=n8n-identity-not-supported.error.js.map