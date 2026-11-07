"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialResolverValidationError = exports.CredentialResolverDataNotFoundError = exports.CredentialResolverError = void 0;
class CredentialResolverError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CredentialResolverError';
    }
}
exports.CredentialResolverError = CredentialResolverError;
class CredentialResolverDataNotFoundError extends CredentialResolverError {
    constructor() {
        super('No data found available for the requested credential and context combination.');
        this.name = 'CredentialResolverDataNotFoundError';
    }
}
exports.CredentialResolverDataNotFoundError = CredentialResolverDataNotFoundError;
class CredentialResolverValidationError extends CredentialResolverError {
    constructor(message) {
        super(`Credential resolver options validation failed: ${message}`);
        this.name = 'CredentialResolverValidationError';
    }
}
exports.CredentialResolverValidationError = CredentialResolverValidationError;
//# sourceMappingURL=errors.js.map