"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSETransport = void 0;
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
class SSETransport extends sse_js_1.SSEServerTransport {
    constructor(endpoint, response) {
        super(endpoint, response);
        this.response = response;
        this.transportType = 'sse';
    }
    async send(message) {
        await super.send(message);
        this.response.flush?.();
    }
    async handleRequest(req, resp, body) {
        await super.handlePostMessage(req, resp, body);
        this.response.flush?.();
    }
}
exports.SSETransport = SSETransport;
//# sourceMappingURL=SSETransport.js.map