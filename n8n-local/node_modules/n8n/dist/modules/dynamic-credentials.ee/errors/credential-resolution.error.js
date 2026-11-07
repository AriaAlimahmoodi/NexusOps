"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialResolutionError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CredentialResolutionError extends n8n_workflow_1.OperationalError {
    constructor(message, options) {
        super(message, options);
        this.name = 'CredentialResolutionError';
    }
}
exports.CredentialResolutionError = CredentialResolutionError;
//# sourceMappingURL=credential-resolution.error.js.map