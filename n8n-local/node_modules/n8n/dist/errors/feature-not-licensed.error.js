"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureNotLicensedError = void 0;
const errors_1 = require("@n8n/errors");
class FeatureNotLicensedError extends errors_1.UserError {
    constructor(feature, opts = {}) {
        super(`Your license does not allow for ${feature}. To enable ${feature}, please upgrade to a license that supports this feature.`, { level: 'warning', extra: opts.extra });
    }
}
exports.FeatureNotLicensedError = FeatureNotLicensedError;
//# sourceMappingURL=feature-not-licensed.error.js.map