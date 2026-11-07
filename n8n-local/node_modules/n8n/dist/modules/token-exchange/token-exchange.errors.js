"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExchangeRequestError = exports.TokenExchangeAuthError = void 0;
const errors_1 = require("@n8n/errors");
class TokenExchangeAuthError extends errors_1.AuthError {
    constructor(reason, message) {
        super(message);
        this.reason = reason;
    }
}
exports.TokenExchangeAuthError = TokenExchangeAuthError;
class TokenExchangeRequestError extends errors_1.BadRequestError {
    constructor(reason, message) {
        super(message);
        this.reason = reason;
    }
}
exports.TokenExchangeRequestError = TokenExchangeRequestError;
//# sourceMappingURL=token-exchange.errors.js.map