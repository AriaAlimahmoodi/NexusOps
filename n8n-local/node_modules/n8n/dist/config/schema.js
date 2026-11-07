"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
exports.schema = {
    userManagement: {
        isInstanceOwnerSetUp: {
            doc: "Whether the instance owner's account has been set up",
            format: Boolean,
            default: false,
        },
        authenticationMethod: {
            doc: 'How to authenticate users (e.g. "email", "ldap", "saml")',
            format: ['email', 'ldap', 'saml'],
            default: 'email',
        },
    },
    endpoints: {
        rest: {
            format: String,
            default: di_1.Container.get(config_1.GlobalConfig).endpoints.rest,
        },
    },
    ai: {
        enabled: {
            format: Boolean,
            default: di_1.Container.get(config_1.GlobalConfig).ai.enabled,
        },
        allowSendingParameterValues: {
            doc: 'Whether to allow sending actual parameter data to AI services',
            format: Boolean,
            default: di_1.Container.get(config_1.GlobalConfig).ai.allowSendingParameterValues,
        },
    },
};
//# sourceMappingURL=schema.js.map