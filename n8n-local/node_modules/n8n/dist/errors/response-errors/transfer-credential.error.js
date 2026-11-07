"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferCredentialError = void 0;
const errors_1 = require("@n8n/errors");
class TransferCredentialError extends errors_1.ResponseError {
    constructor(message) {
        super(message, 400, 400);
    }
}
exports.TransferCredentialError = TransferCredentialError;
//# sourceMappingURL=transfer-credential.error.js.map