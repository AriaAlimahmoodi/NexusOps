"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickConnectError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class QuickConnectError extends n8n_workflow_1.OperationalError {
    constructor(message, credentialType, cause) {
        super(message, { cause, extra: { credentialType } });
        this.credentialType = credentialType;
    }
}
exports.QuickConnectError = QuickConnectError;
//# sourceMappingURL=quick-connect.errors.js.map