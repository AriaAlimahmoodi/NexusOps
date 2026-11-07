"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentChannelRef = agentChannelRef;
exports.agentChannelKey = agentChannelKey;
function agentChannelRef(agentId, integration) {
    return { agentId, integrationType: integration.type, credentialId: integration.credentialId };
}
function agentChannelKey(ref) {
    return `${ref.agentId}:${ref.integrationType}:${ref.credentialId}`;
}
//# sourceMappingURL=agent-channel.js.map