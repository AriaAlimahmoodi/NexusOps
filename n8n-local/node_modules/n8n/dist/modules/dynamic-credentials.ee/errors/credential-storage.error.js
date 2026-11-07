"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialStorageError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class CredentialStorageError extends n8n_workflow_1.UserError {
    constructor(message, options) {
        super(message, options);
        this.name = 'CredentialStorageError';
    }
}
exports.CredentialStorageError = CredentialStorageError;
//# sourceMappingURL=credential-storage.error.js.map