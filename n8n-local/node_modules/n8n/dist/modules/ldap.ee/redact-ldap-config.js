"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactLdapConfig = redactLdapConfig;
const n8n_workflow_1 = require("n8n-workflow");
function redactLdapConfig(config) {
    return {
        ...config,
        bindingAdminPassword: config.bindingAdminPassword ? n8n_workflow_1.CREDENTIAL_BLANKING_VALUE : '',
    };
}
//# sourceMappingURL=redact-ldap-config.js.map