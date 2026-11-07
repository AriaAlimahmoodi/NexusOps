"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toN8nConnectCoverage = toN8nConnectCoverage;
function toN8nConnectCoverage(availability) {
    if (!availability.available)
        return undefined;
    return {
        credentialTypes: availability.config.credentialTypes,
        nodes: availability.config.nodes,
    };
}
//# sourceMappingURL=mcp-ai-gateway.helper.js.map