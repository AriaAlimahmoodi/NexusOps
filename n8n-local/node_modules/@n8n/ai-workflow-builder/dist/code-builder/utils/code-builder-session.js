"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryToString = entryToString;
exports.loadCodeBuilderSession = loadCodeBuilderSession;
exports.saveCodeBuilderSession = saveCodeBuilderSession;
exports.compactSessionIfNeeded = compactSessionIfNeeded;
exports.generateCodeBuilderThreadId = generateCodeBuilderThreadId;
exports.saveSessionMessages = saveSessionMessages;
const messages_1 = require("@langchain/core/messages");
const conversation_compact_1 = require("../../chains/conversation-compact");
const thread_id_1 = require("../../utils/thread-id");
const MAX_USER_MESSAGES = 20;
const MESSAGES_TO_COMPACT = 10;
function entryToString(entry) {
    switch (entry.type) {
        case 'build-request':
            return entry.message;
        case 'assistant-exchange':
            return `[Help] Q: ${entry.userQuery} → A: ${entry.assistantSummary}`;
        case 'plan':
            return `[Plan] Q: ${entry.userQuery} → ${entry.plan}`;
    }
}
function isSessionCheckpoint(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const obj = value;
    if ('conversationEntries' in obj && Array.isArray(obj.conversationEntries))
        return true;
    if ('userMessages' in obj && Array.isArray(obj.userMessages))
        return true;
    return false;
}
async function loadCodeBuilderSession(checkpointer, threadId) {
    const config = {
        configurable: {
            thread_id: threadId,
        },
    };
    try {
        const checkpointTuple = await checkpointer.getTuple(config);
        if (!checkpointTuple?.checkpoint) {
            return { conversationEntries: [] };
        }
        const channelValues = checkpointTuple.checkpoint.channel_values;
        const sessionData = channelValues?.codeBuilderSession;
        if (isSessionCheckpoint(sessionData)) {
            if (sessionData.conversationEntries) {
                return {
                    conversationEntries: sessionData.conversationEntries,
                    previousSummary: sessionData.previousSummary,
                    sdkSessionId: sessionData.sdkSessionId,
                };
            }
            if (sessionData.userMessages) {
                return {
                    conversationEntries: sessionData.userMessages.map((msg) => ({
                        type: 'build-request',
                        message: msg,
                    })),
                    previousSummary: sessionData.previousSummary,
                };
            }
        }
        return { conversationEntries: [] };
    }
    catch {
        return { conversationEntries: [] };
    }
}
async function saveCodeBuilderSession(checkpointer, threadId, session) {
    const config = {
        configurable: {
            thread_id: threadId,
        },
    };
    const existingTuple = await checkpointer.getTuple(config).catch(() => undefined);
    const existingCheckpoint = existingTuple?.checkpoint;
    const sessionPayload = {
        conversationEntries: session.conversationEntries,
        previousSummary: session.previousSummary,
        sdkSessionId: session.sdkSessionId,
    };
    const checkpoint = existingCheckpoint
        ? {
            ...existingCheckpoint,
            ts: new Date().toISOString(),
            channel_values: {
                ...existingCheckpoint.channel_values,
                codeBuilderSession: sessionPayload,
            },
        }
        : {
            v: 1,
            id: crypto.randomUUID(),
            ts: new Date().toISOString(),
            channel_values: {
                codeBuilderSession: sessionPayload,
            },
            channel_versions: {},
            versions_seen: {},
        };
    const metadata = existingTuple?.metadata ?? {
        source: 'update',
        step: -1,
        parents: {},
    };
    await checkpointer.put(config, checkpoint, metadata);
}
async function compactSessionIfNeeded(session, llm, maxMessages = MAX_USER_MESSAGES) {
    if (session.conversationEntries.length <= maxMessages) {
        return session;
    }
    const oldEntries = session.conversationEntries.slice(0, MESSAGES_TO_COMPACT);
    const recentEntries = session.conversationEntries.slice(MESSAGES_TO_COMPACT);
    const messages = oldEntries.map((entry) => new messages_1.HumanMessage(entryToString(entry)));
    const result = await (0, conversation_compact_1.conversationCompactChain)(llm, messages, session.previousSummary ?? '');
    let newSummary;
    if (session.previousSummary) {
        newSummary = `${session.previousSummary}\n\n---\n\n${result.summaryPlain}`;
    }
    else {
        newSummary = result.summaryPlain;
    }
    return {
        conversationEntries: recentEntries,
        previousSummary: newSummary,
        sdkSessionId: session.sdkSessionId,
    };
}
function generateCodeBuilderThreadId(workflowId, userId) {
    return `code-builder-${workflowId}-${userId}`;
}
async function saveSessionMessages(checkpointer, workflowId, userId, messages, versionId, userMessageId) {
    const threadId = (0, thread_id_1.generateThreadId)(workflowId, userId, 'code-builder');
    const config = {
        configurable: {
            thread_id: threadId,
        },
    };
    const existingTuple = await checkpointer.getTuple(config).catch(() => undefined);
    const existingCheckpoint = existingTuple?.checkpoint;
    const existingMessages = existingCheckpoint?.channel_values?.messages ?? [];
    const messageId = userMessageId ?? crypto.randomUUID();
    const firstHumanMessageIndex = messages.findIndex((msg) => msg instanceof messages_1.HumanMessage);
    const messagesWithMetadata = messages.map((msg, index) => {
        if (index === firstHumanMessageIndex && msg instanceof messages_1.HumanMessage) {
            return new messages_1.HumanMessage({
                content: msg.content,
                additional_kwargs: {
                    ...msg.additional_kwargs,
                    messageId,
                    ...(versionId && { versionId }),
                },
            });
        }
        return msg;
    });
    const allMessages = [...existingMessages, ...messagesWithMetadata];
    const checkpoint = existingCheckpoint
        ? {
            ...existingCheckpoint,
            ts: new Date().toISOString(),
            channel_values: {
                ...existingCheckpoint.channel_values,
                messages: allMessages,
            },
        }
        : {
            v: 1,
            id: crypto.randomUUID(),
            ts: new Date().toISOString(),
            channel_values: {
                messages: allMessages,
            },
            channel_versions: {},
            versions_seen: {},
        };
    const metadata = existingTuple?.metadata ?? {
        source: 'update',
        step: -1,
        parents: {},
    };
    await checkpointer.put(config, checkpoint, metadata);
}
//# sourceMappingURL=code-builder-session.js.map