"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialResolverNotConfiguredError = void 0;
const credential_resolution_error_1 = require("./credential-resolution.error");
class CredentialResolverNotConfiguredError extends credential_resolution_error_1.CredentialResolutionError {
    constructor(credentialName) {
        super(`No resolver configured for dynamic credential "${credentialName}"`);
        this.name = 'CredentialResolverNotConfiguredError';
    }
}
exports.CredentialResolverNotConfiguredError = CredentialResolverNotConfiguredError;
//# sourceMappingURL=credential-resolver-not-configured.error.js.map