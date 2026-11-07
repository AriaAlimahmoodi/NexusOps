"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromContent = extractTextFromContent;
exports.parseStoredMessages = parseStoredMessages;
exports.collectConfirmationRequestIds = collectConfirmationRequestIds;
exports.markExpiredConfirmations = markExpiredConfirmations;
const api_types_1 = require("@n8n/api-types");
const zod_1 = require("zod");
const internal_messages_1 = require("./internal-messages");
const textContentPartSchema = zod_1.z.object({ type: zod_1.z.literal('text'), text: zod_1.z.string() });
const reasoningContentPartSchema = zod_1.z.object({ type: zod_1.z.literal('reasoning'), text: zod_1.z.string() });
function extractTextFromContent(content) {
    if (typeof content === 'string')
        return content;
    if (Array.isArray(content))
        return extractTextFromParts(content);
    return '';
}
function extractReasoningFromContent(content) {
    if (typeof content === 'string')
        return '';
    if (Array.isArray(content))
        return extractReasoningFromParts(content);
    return '';
}
function extractTextFromParts(parts) {
    return parts
        .flatMap((p) => {
        const parsed = textContentPartSchema.safeParse(p);
        return parsed.success ? [parsed.data.text] : [];
    })
        .join('');
}
function extractReasoningFromParts(parts) {
    return parts
        .flatMap((p) => {
        const parsed = reasoningContentPartSchema.safeParse(p);
        return parsed.success ? [parsed.data.text] : [];
    })
        .join('');
}
function isRenderableTree(tree) {
    return (tree.children.length > 0 ||
        tree.toolCalls.length > 0 ||
        tree.timeline.length > 0 ||
        tree.textContent.length > 0 ||
        tree.reasoning.length > 0 ||
        (tree.planItems?.length ?? 0) > 0 ||
        !!tree.tasks ||
        !!tree.setupItemsByWorkflowId ||
        !!tree.statusMessage ||
        !!tree.result ||
        !!tree.error);
}
function snapshotTimestamp(snapshot) {
    return (snapshot.updatedAt ?? snapshot.createdAt ?? new Date(0)).toISOString();
}
function snapshotCreatedAtMs(snapshot) {
    return snapshot.createdAt?.getTime();
}
function messageCreatedAtMs(message) {
    return message.createdAt.getTime();
}
function getNextConversationMessageTimestamp(messages, currentIndex) {
    for (let i = currentIndex + 1; i < messages.length; i++) {
        const role = messages[i].role;
        if (role === 'user' || role === 'assistant')
            return messageCreatedAtMs(messages[i]);
    }
    return undefined;
}
function buildSnapshotMessage(snapshot) {
    const groupId = snapshot.messageGroupId ?? snapshot.runId;
    return {
        id: groupId,
        runId: snapshot.runId,
        messageGroupId: snapshot.messageGroupId,
        runIds: snapshot.runIds,
        role: 'assistant',
        createdAt: snapshotTimestamp(snapshot),
        content: snapshot.tree.textContent,
        reasoning: snapshot.tree.reasoning,
        isStreaming: false,
        agentTree: snapshot.tree,
    };
}
function parseStoredMessages(storedMessages, snapshots) {
    const messages = [];
    const snapshotList = snapshots ?? [];
    const conversationMessages = storedMessages.filter((message) => 'role' in message);
    let nextSnapshotIdx = 0;
    const consumedSnapshots = new Set();
    const messagesWithSnapshotTree = new Set();
    let lastUserMessageId;
    function pushSnapshotMessage(snapshot) {
        const built = buildSnapshotMessage(snapshot);
        if (isRenderableTree(snapshot.tree))
            messagesWithSnapshotTree.add(built);
        messages.push(built);
    }
    function appendChronologicalOrphansBefore(message) {
        const messageTimestamp = messageCreatedAtMs(message);
        while (nextSnapshotIdx < snapshotList.length) {
            const snapshot = snapshotList[nextSnapshotIdx];
            const snapshotTimestamp = snapshotCreatedAtMs(snapshot);
            if (snapshotTimestamp === undefined || snapshotTimestamp >= messageTimestamp)
                return;
            consumedSnapshots.add(snapshot);
            pushSnapshotMessage(snapshot);
            nextSnapshotIdx++;
        }
    }
    function takeSnapshotForAssistant(message, messageIndex) {
        appendChronologicalOrphansBefore(message);
        const snapshot = snapshotList[nextSnapshotIdx];
        if (!snapshot)
            return undefined;
        const nextMessageTimestamp = getNextConversationMessageTimestamp(conversationMessages, messageIndex);
        const snapshotTimestamp = snapshotCreatedAtMs(snapshot);
        if (snapshotTimestamp === undefined ||
            (nextMessageTimestamp !== undefined && snapshotTimestamp > nextMessageTimestamp)) {
            return undefined;
        }
        consumedSnapshots.add(snapshot);
        nextSnapshotIdx++;
        return snapshot;
    }
    for (const [messageIndex, msg] of conversationMessages.entries()) {
        appendChronologicalOrphansBefore(msg);
        const text = extractTextFromContent(msg.content);
        if (msg.role === 'user') {
            lastUserMessageId = msg.id;
            const content = (0, internal_messages_1.cleanStoredUserMessage)(text);
            if (content === null)
                continue;
            const attachments = (0, internal_messages_1.extractEditorContextResourceAttachments)(text);
            const context = (0, internal_messages_1.extractAgentPreviewHandoffContext)(text);
            messages.push({
                id: msg.id,
                role: 'user',
                createdAt: msg.createdAt.toISOString(),
                content,
                reasoning: '',
                isStreaming: false,
                ...(attachments.length > 0 ? { attachments } : {}),
                ...(context ? { context } : {}),
            });
            continue;
        }
        if (msg.role === 'assistant') {
            const reasoning = extractReasoningFromContent(msg.content);
            const snapshot = takeSnapshotForAssistant(msg, messageIndex);
            const runId = snapshot?.runId ?? lastUserMessageId ?? msg.id;
            const snapshotIsRenderable = snapshot !== undefined && isRenderableTree(snapshot.tree);
            const agentTree = snapshotIsRenderable ? snapshot.tree : undefined;
            const assistantMessage = {
                id: msg.id,
                runId,
                messageGroupId: snapshot?.messageGroupId,
                runIds: snapshot?.runIds,
                role: 'assistant',
                createdAt: msg.createdAt.toISOString(),
                content: text,
                reasoning,
                isStreaming: false,
                agentTree,
            };
            if (snapshotIsRenderable)
                messagesWithSnapshotTree.add(assistantMessage);
            messages.push(assistantMessage);
            continue;
        }
    }
    for (const snapshot of snapshots ?? []) {
        if (consumedSnapshots.has(snapshot))
            continue;
        pushSnapshotMessage(snapshot);
    }
    propagateMessageGroupIdAcrossTurns(messages);
    const keptIndexByGid = new Map();
    const toRemove = new Set();
    for (let i = messages.length - 1; i >= 0; i--) {
        const gid = messages[i].messageGroupId;
        if (!gid)
            continue;
        const keptIdx = keptIndexByGid.get(gid);
        if (keptIdx === undefined) {
            keptIndexByGid.set(gid, i);
            continue;
        }
        const kept = messages[keptIdx];
        const candidate = messages[i];
        if (!messagesWithSnapshotTree.has(kept) && messagesWithSnapshotTree.has(candidate)) {
            kept.agentTree = candidate.agentTree;
            kept.runIds = candidate.runIds;
            messagesWithSnapshotTree.add(kept);
        }
        toRemove.add(i);
    }
    for (let i = messages.length - 1; i >= 0; i--) {
        if (toRemove.has(i))
            messages.splice(i, 1);
    }
    for (const msg of messages) {
        if (msg.agentTree)
            (0, api_types_1.normalizeAgentTree)(msg.agentTree);
    }
    return messages;
}
function propagateMessageGroupIdAcrossTurns(messages) {
    let turnStart = 0;
    for (let i = 0; i <= messages.length; i++) {
        const atBoundary = i === messages.length || messages[i].role === 'user';
        if (!atBoundary)
            continue;
        propagateMessageGroupIdWithinRange(messages, turnStart, i);
        turnStart = i + 1;
    }
}
function propagateMessageGroupIdWithinRange(messages, start, end) {
    let turnGroupId;
    for (let i = end - 1; i >= start; i--) {
        const gid = messages[i].messageGroupId;
        if (gid) {
            turnGroupId = gid;
            break;
        }
    }
    if (!turnGroupId)
        return;
    for (let i = start; i < end; i++) {
        const msg = messages[i];
        if (msg.role === 'assistant' && !msg.messageGroupId) {
            msg.messageGroupId = turnGroupId;
        }
    }
}
function isActionableConfirmation(tc) {
    return (tc.confirmation !== undefined &&
        tc.isLoading &&
        tc.confirmationStatus !== 'approved' &&
        tc.confirmationStatus !== 'denied');
}
function collectConfirmationRequestIds(messages) {
    const requestIds = [];
    for (const message of messages) {
        if (!message.agentTree)
            continue;
        walkAgentNodes(message.agentTree, (node) => {
            for (const tc of node.toolCalls) {
                const { confirmation } = tc;
                if (!confirmation || !isActionableConfirmation(tc))
                    continue;
                requestIds.push(confirmation.requestId);
            }
        });
    }
    return requestIds;
}
function markExpiredConfirmations(messages, liveRequestIds) {
    for (const message of messages) {
        if (!message.agentTree)
            continue;
        walkAgentNodes(message.agentTree, (node) => {
            for (const tc of node.toolCalls) {
                const { confirmation } = tc;
                if (!confirmation || !isActionableConfirmation(tc))
                    continue;
                if (!liveRequestIds.has(confirmation.requestId)) {
                    confirmation.expired = true;
                }
            }
        });
    }
}
function walkAgentNodes(node, visit) {
    visit(node);
    for (const child of node.children)
        walkAgentNodes(child, visit);
}
//# sourceMappingURL=message-parser.js.map