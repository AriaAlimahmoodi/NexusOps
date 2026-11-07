"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentialField = credentialField;
exports.requireCredentialField = requireCredentialField;
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
function credentialField(credential, field) {
    if (!(0, is_record_1.isRecord)(credential))
        return '';
    const value = credential[field];
    return typeof value === 'string' ? value.trim() : '';
}
function requireCredentialField(credential, field, message) {
    const value = credentialField(credential, field);
    if (!value)
        throw new n8n_workflow_1.UserError(message);
    return value;
}
//# sourceMappingURL=credential-fields.js.map