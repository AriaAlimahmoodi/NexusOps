"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQdrantClient = createQdrantClient;
const js_client_rest_1 = require("@qdrant/js-client-rest");
const n8n_workflow_1 = require("n8n-workflow");
function parseQdrantUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return {
            protocol: parsedUrl.protocol,
            host: parsedUrl.hostname,
            port: parsedUrl.port
                ? parseInt(parsedUrl.port, 10)
                : parsedUrl.protocol === 'https:'
                    ? 443
                    : 80,
        };
    }
    catch (error) {
        throw new n8n_workflow_1.UserError(`Invalid Qdrant URL: ${url}. Please provide a valid URL with protocol (http/https)`);
    }
}
function createQdrantClient(credentials) {
    const { protocol, host, port } = parseQdrantUrl(credentials.qdrantUrl);
    const qdrantClient = new js_client_rest_1.QdrantClient({
        host,
        apiKey: credentials.apiKey,
        https: protocol === 'https:',
        port,
    });
    return qdrantClient;
}
//# sourceMappingURL=Qdrant.utils.js.map