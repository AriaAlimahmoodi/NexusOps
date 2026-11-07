"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.samlLicensedMiddleware = exports.samlLicensedAndEnabledMiddleware = void 0;
const sso_helpers_1 = require("../../../sso.ee/sso-helpers");
const samlLicensedAndEnabledMiddleware = (_, res, next) => {
    if ((0, sso_helpers_1.isSamlLicensedAndEnabled)()) {
        next();
    }
    else {
        res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }
};
exports.samlLicensedAndEnabledMiddleware = samlLicensedAndEnabledMiddleware;
const samlLicensedMiddleware = (_, res, next) => {
    if ((0, sso_helpers_1.isSamlLicensed)()) {
        next();
    }
    else {
        res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }
};
exports.samlLicensedMiddleware = samlLicensedMiddleware;
//# sourceMappingURL=saml-enabled-middleware.js.map