"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlEmailNotVerifiedError = void 0;
const errors_1 = require("@n8n/errors");
class SamlEmailNotVerifiedError extends errors_1.AuthError {
    constructor(email) {
        super('Email address is not verified by the identity provider');
        this.email = email;
    }
}
exports.SamlEmailNotVerifiedError = SamlEmailNotVerifiedError;
//# sourceMappingURL=saml-email-not-verified.error.js.map