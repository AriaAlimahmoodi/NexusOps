"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportFactory = void 0;
const crypto_1 = require("crypto");
const SSETransport_1 = require("./SSETransport");
const StreamableHttpTransport_1 = require("./StreamableHttpTransport");
class TransportFactory {
    createSSE(postUrl, response) {
        return new SSETransport_1.SSETransport(postUrl, response);
    }
    createStreamableHttp(options, response) {
        return new StreamableHttpTransport_1.StreamableHttpTransport({
            sessionIdGenerator: options.sessionIdGenerator ?? (() => (0, crypto_1.randomUUID)()),
            onsessioninitialized: options.onsessioninitialized,
        }, response);
    }
    recreateStreamableHttp(sessionId, response) {
        const transport = new StreamableHttpTransport_1.StreamableHttpTransport({ sessionIdGenerator: () => sessionId }, response);
        transport.markAsInitialized(sessionId);
        return transport;
    }
}
exports.TransportFactory = TransportFactory;
//# sourceMappingURL=TransportFactory.js.map