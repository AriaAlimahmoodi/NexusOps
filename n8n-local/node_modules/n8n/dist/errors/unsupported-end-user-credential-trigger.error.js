"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedEndUserCredentialTriggerError = void 0;
const errors_1 = require("@n8n/errors");
const SYSTEM_RESOLVER_MESSAGE = "End-user credentials aren't supported by this workflow's trigger. Supported triggers: Manual, Sub-workflow, Chat available in n8n Chat Hub or using n8n user authentication in hosted chat mode, and MCP, Form, or Webhook with n8n user authentication. To use another trigger, switch this credential to Fixed.";
const CUSTOM_RESOLVER_MESSAGE = 'End-user credentials with this resolver need a trigger that extracts an identity. Configure an identity extractor on the trigger, or switch this credential to Fixed.';
class UnsupportedEndUserCredentialTriggerError extends errors_1.UserError {
    constructor(resolverType) {
        super(resolverType === 'system' ? SYSTEM_RESOLVER_MESSAGE : CUSTOM_RESOLVER_MESSAGE);
    }
}
exports.UnsupportedEndUserCredentialTriggerError = UnsupportedEndUserCredentialTriggerError;
//# sourceMappingURL=unsupported-end-user-credential-trigger.error.js.map