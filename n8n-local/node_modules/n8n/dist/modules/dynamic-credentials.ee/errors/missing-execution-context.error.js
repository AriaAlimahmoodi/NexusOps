"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingExecutionContextError = void 0;
const credential_resolution_error_1 = require("./credential-resolution.error");
class MissingExecutionContextError extends credential_resolution_error_1.CredentialResolutionError {
    constructor() {
        super("This node uses an end-user credential, but no user could be identified for this run, so the credential for it couldn't be resolved");
        this.name = 'MissingExecutionContextError';
    }
}
exports.MissingExecutionContextError = MissingExecutionContextError;
//# sourceMappingURL=missing-execution-context.error.js.map