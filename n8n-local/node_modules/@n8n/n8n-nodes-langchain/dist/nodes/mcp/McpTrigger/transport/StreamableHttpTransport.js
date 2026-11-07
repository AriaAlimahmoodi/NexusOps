"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamableHttpTransport = void 0;
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
function getWebStandardTransport(transport) {
    if (typeof transport === 'object' && transport !== null && '_webStandardTransport' in transport) {
        const internal = transport._webStandardTransport;
        if (typeof internal === 'object' && internal !== null) {
            return internal;
        }
    }
    return undefined;
}
class StreamableHttpTransport extends streamableHttp_js_1.StreamableHTTPServerTransport {
    constructor(options, response) {
        super(options);
        this.transportType = 'streamableHttp';
        this.response = response;
    }
    markAsInitialized(sessionId) {
        const webStandardTransport = getWebStandardTransport(this);
        if (!webStandardTransport) {
            throw new Error('Failed to initialize StreamableHttpTransport: internal transport state not found. ' +
                'This may indicate an incompatible SDK version.');
        }
        webStandardTransport._initialized = true;
        webStandardTransport.sessionId = sessionId;
    }
    async send(message) {
        await super.send(message);
        this.response.flush?.();
    }
    async handleRequest(req, resp, parsedBody) {
        await super.handleRequest(req, resp, parsedBody);
        this.response.flush?.();
    }
}
exports.StreamableHttpTransport = StreamableHttpTransport;
//# sourceMappingURL=StreamableHttpTransport.js.map