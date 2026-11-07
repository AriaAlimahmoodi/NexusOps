"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LdapConnectionError = exports.LdapRejectionError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class LdapRejectionError extends n8n_workflow_1.UserError {
}
exports.LdapRejectionError = LdapRejectionError;
class LdapConnectionError extends n8n_workflow_1.OperationalError {
}
exports.LdapConnectionError = LdapConnectionError;
//# sourceMappingURL=ldap.errors.js.map