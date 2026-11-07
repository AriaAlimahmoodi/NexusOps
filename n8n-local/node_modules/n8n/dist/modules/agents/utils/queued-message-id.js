"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queuedMessageId = queuedMessageId;
const uuid_1 = require("uuid");
const MESSAGE_NAMESPACE = (0, uuid_1.v5)('n8n-agent-message-acceptance-v1', uuid_1.v5.URL);
function queuedMessageId(agentId, threadId, payload) {
    if (payload.kind !== 'integration') {
        if (!payload.messageId)
            return undefined;
        return (0, uuid_1.v5)(JSON.stringify([
            payload.kind,
            agentId,
            payload.userId,
            threadId,
            payload.messageId.toLowerCase(),
        ]), MESSAGE_NAMESPACE);
    }
    const { platform, integrationConnectionId, messageId } = payload.messageContext;
    if (!messageId)
        return undefined;
    return (0, uuid_1.v5)(JSON.stringify([
        'integration',
        agentId,
        platform,
        integrationConnectionId,
        payload.platformThreadId,
        messageId,
    ]), MESSAGE_NAMESPACE);
}
//# sourceMappingURL=queued-message-id.js.map