"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoAccessDeniedError = void 0;
const errors_1 = require("@n8n/errors");
class SsoAccessDeniedError extends errors_1.ForbiddenError {
    constructor() {
        super('Access denied by SSO role mapping configuration');
    }
}
exports.SsoAccessDeniedError = SsoAccessDeniedError;
//# sourceMappingURL=sso-access-denied.error.js.map