"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsOverwritesAlreadySetError = void 0;
const errors_1 = require("@n8n/errors");
class CredentialsOverwritesAlreadySetError extends errors_1.UserError {
    constructor() {
        super('Credentials overwrites may not be set more than once.');
    }
}
exports.CredentialsOverwritesAlreadySetError = CredentialsOverwritesAlreadySetError;
//# sourceMappingURL=credentials-overwrites-already-set.error.js.map