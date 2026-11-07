"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookResponder = void 0;
class WebhookResponder {
    constructor(sendResponse) {
        this.sendResponse = sendResponse;
        this.responded = false;
    }
    get hasResponded() {
        return this.responded;
    }
    respondWith(data) {
        this.sendResponse(null, data);
        this.responded = true;
    }
    respondWithNoResponse() {
        this.sendResponse(null, { noWebhookResponse: true });
        this.responded = true;
    }
    respondWithError(error) {
        this.sendResponse(error, {});
        this.responded = true;
    }
    markResponded() {
        this.responded = true;
    }
}
exports.WebhookResponder = WebhookResponder;
//# sourceMappingURL=webhook-responder.js.map