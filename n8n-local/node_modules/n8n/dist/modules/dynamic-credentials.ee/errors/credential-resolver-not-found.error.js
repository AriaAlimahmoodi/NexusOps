"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialResolverNotFoundError = exports.DynamicCredentialResolverNotFoundError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const credential_resolution_error_1 = require("./credential-resolution.error");
class DynamicCredentialResolverNotFoundError extends n8n_workflow_1.UserError {
    constructor(resolverId) {
        super(`Credential resolver with ID "${resolverId}" does not exist.`);
    }
}
exports.DynamicCredentialResolverNotFoundError = DynamicCredentialResolverNotFoundError;
class CredentialResolverNotFoundError extends credential_resolution_error_1.CredentialResolutionError {
    constructor(credentialName, resolverId) {
        super(`Resolver "${resolverId}" not found for credential "${credentialName}"`);
        this.name = 'CredentialResolverNotFoundError';
    }
}
exports.CredentialResolverNotFoundError = CredentialResolverNotFoundError;
//# sourceMappingURL=credential-resolver-not-found.error.js.map