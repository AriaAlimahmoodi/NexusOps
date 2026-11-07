"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookResponseTooLargeError = void 0;
const errors_1 = require("@n8n/errors");
class WebhookResponseTooLargeError extends errors_1.UserError {
    constructor(message, options) {
        super(message, options);
    }
}
exports.WebhookResponseTooLargeError = WebhookResponseTooLargeError;
//# sourceMappingURL=webhook-response-too-large.error.js.map