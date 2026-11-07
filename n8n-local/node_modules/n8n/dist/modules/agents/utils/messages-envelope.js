"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withOpenSuspensions = withOpenSuspensions;
const agents_1 = require("@n8n/agents");
const agent_message_mapper_1 = require("../agent-message-mapper");
const agent_chat_suspension_cards_1 = require("../integrations/agent-chat-suspension-cards");
function isTerminalToolCallPart(part) {
    return (part.type === 'tool-call' &&
        (part.state === 'resolved' ||
            part.state === 'rejected' ||
            part.canceled === true ||
            part.output !== undefined ||
            part.error !== undefined));
}
function getOpenSuspendedToolCallIds(message, openToolCallIds) {
    const ids = [];
    for (const part of message.content) {
        if (part.type === 'tool-call' &&
            typeof part.toolCallId === 'string' &&
            openToolCallIds.has(part.toolCallId)) {
            ids.push(part.toolCallId);
        }
    }
    return ids;
}
function mergeOpenSuspendedToolCalls(existing, checkpoint, openToolCallIds) {
    const checkpointParts = new Map();
    for (const part of checkpoint.content) {
        if (part.type === 'tool-call' &&
            typeof part.toolCallId === 'string' &&
            openToolCallIds.has(part.toolCallId)) {
            checkpointParts.set(part.toolCallId, part);
        }
    }
    let matchedAny = false;
    const content = existing.content.map((part) => {
        if (part.type !== 'tool-call' || typeof part.toolCallId !== 'string')
            return part;
        const checkpointPart = checkpointParts.get(part.toolCallId);
        if (!checkpointPart)
            return part;
        matchedAny = true;
        if (isTerminalToolCallPart(part))
            return part;
        return { ...part, ...checkpointPart };
    });
    if (!matchedAny)
        return checkpoint;
    return {
        ...existing,
        content,
    };
}
function withOpenSuspensions(messages, checkpoint, options = {}) {
    if (!checkpoint)
        return { messages, openSuspensions: [] };
    const openSuspensions = Object.values(checkpoint.pendingToolCalls ?? {})
        .filter((tc) => tc.suspended)
        .map((tc) => ({
        toolCallId: tc.toolCallId,
        runId: tc.runId,
        suspendPayload: (0, agent_chat_suspension_cards_1.isApprovalSuspendPayload)(tc.suspendPayload)
            ? (0, agents_1.redactDeep)(tc.suspendPayload, { redactSensitiveKeys: true }).value
            : tc.suspendPayload,
    }));
    const openToolCallIds = new Set(openSuspensions.map((s) => s.toolCallId));
    const merged = [...messages];
    const byId = new Map(messages.map((m, index) => [m.id, index]));
    const existingIndexByOpenToolCallId = new Map();
    for (const [index, message] of messages.entries()) {
        for (const toolCallId of getOpenSuspendedToolCallIds(message, openToolCallIds)) {
            existingIndexByOpenToolCallId.set(toolCallId, index);
        }
    }
    const checkpointMessages = (0, agent_message_mapper_1.messagesToDto)(checkpoint.messageList.messages);
    const checkpointTurnAlreadyPersisted = checkpointMessages.some((message) => getOpenSuspendedToolCallIds(message, openToolCallIds).some((toolCallId) => existingIndexByOpenToolCallId.has(toolCallId)));
    for (const checkpointMessage of checkpointMessages) {
        const checkpointToolCallIds = getOpenSuspendedToolCallIds(checkpointMessage, openToolCallIds);
        const existingIndex = byId.get(checkpointMessage.id);
        if (existingIndex === undefined) {
            const matchingToolCallId = checkpointToolCallIds.find((toolCallId) => existingIndexByOpenToolCallId.has(toolCallId));
            const matchingIndex = matchingToolCallId === undefined
                ? undefined
                : existingIndexByOpenToolCallId.get(matchingToolCallId);
            if (matchingIndex !== undefined) {
                merged[matchingIndex] = mergeOpenSuspendedToolCalls(merged[matchingIndex], checkpointMessage, openToolCallIds);
                continue;
            }
            if (checkpointTurnAlreadyPersisted && checkpointToolCallIds.length === 0)
                continue;
            if (options.appendInactiveCheckpointMessages === false &&
                checkpointToolCallIds.length === 0) {
                continue;
            }
            byId.set(checkpointMessage.id, merged.length);
            merged.push(checkpointMessage);
            continue;
        }
        if (checkpointToolCallIds.length > 0) {
            merged[existingIndex] = mergeOpenSuspendedToolCalls(merged[existingIndex], checkpointMessage, openToolCallIds);
        }
    }
    return { messages: merged, openSuspensions };
}
//# sourceMappingURL=messages-envelope.js.map