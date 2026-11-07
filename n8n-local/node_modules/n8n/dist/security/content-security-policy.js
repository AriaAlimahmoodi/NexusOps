"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContentSecurityPolicy = exports.resolveContentSecurityPolicies = void 0;
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const resolveContentSecurityPolicies = (policy, reportOnly, logger) => {
    if ((0, config_1.isLegacyBooleanSetting)(reportOnly)) {
        logger.warn('N8N_CONTENT_SECURITY_POLICY_REPORT_ONLY is deprecated as a boolean: the variable now holds the policy to report on, in the same formats as N8N_CONTENT_SECURITY_POLICY. Honoring the old meaning for now - set it to a policy, or to `{}` to report on nothing.');
        return reportOnly.legacyBoolean
            ? { reportOnly: policy ?? config_1.DEFAULT_CONTENT_SECURITY_POLICY }
            : { enforced: policy, reportOnly: config_1.DEFAULT_CONTENT_SECURITY_POLICY };
    }
    return { enforced: policy, reportOnly };
};
exports.resolveContentSecurityPolicies = resolveContentSecurityPolicies;
const renderContentSecurityPolicy = (policy, nonce) => policy.replaceAll(constants_1.NONCE_PLACEHOLDER, `'nonce-${nonce}'`);
exports.renderContentSecurityPolicy = renderContentSecurityPolicy;
//# sourceMappingURL=content-security-policy.js.map