"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantHandler = void 0;
const constants_1 = require("../constants");
const SUMMARY_MAX_LENGTH = 200;
class AssistantHandler {
    client;
    logger;
    constructor(client, logger) {
        this.client = client;
        this.logger = logger;
    }
    async execute(context, userId, writer, abortSignal) {
        const payload = this.buildSdkPayload(context);
        const toolCallId = `assistant-${crypto.randomUUID()}`;
        await writer({
            type: 'tool',
            toolName: 'assistant',
            toolCallId,
            displayTitle: 'Asking assistant',
            status: 'running',
        });
        try {
            const response = await this.callSdk(payload, userId);
            return await this.consumeSdkStream(response, writer, abortSignal, toolCallId, context);
        }
        finally {
            await writer({
                type: 'tool',
                toolName: 'assistant',
                toolCallId,
                status: 'completed',
            });
        }
    }
    buildSdkPayload(context) {
        if (context.sdkSessionId) {
            return {
                payload: {
                    role: 'user',
                    type: 'message',
                    text: context.query,
                },
                sessionId: context.sdkSessionId,
            };
        }
        const initPayload = {
            role: 'user',
            type: 'init-support-chat',
            user: { firstName: context.userName ?? 'User' },
            question: context.query,
        };
        if (context.workflowJSON) {
            initPayload.workflowContext = {
                currentWorkflow: {
                    name: context.workflowJSON.name,
                    nodes: context.workflowJSON.nodes.map((n) => ({ name: n.name, type: n.type })),
                    connections: context.workflowJSON.connections,
                },
            };
        }
        if (context.errorContext) {
            initPayload.context = {
                ...(initPayload.context ?? {}),
                activeNodeInfo: {
                    node: { name: context.errorContext.nodeName },
                    executionStatus: {
                        status: 'error',
                        error: {
                            message: context.errorContext.errorMessage,
                            description: context.errorContext.errorDescription,
                        },
                    },
                },
            };
        }
        if (context.credentialContext) {
            initPayload.context = {
                ...(initPayload.context ?? {}),
                activeCredentials: {
                    name: context.credentialContext.credentialType,
                    displayName: context.credentialContext.displayName,
                },
            };
        }
        return { payload: initPayload };
    }
    async callSdk(payload, userId) {
        const response = await this.client.chat(payload, { id: userId });
        if (!response.ok) {
            throw new Error(`Assistant SDK returned HTTP ${String(response.status)}`);
        }
        return response;
    }
    async consumeSdkStream(response, writer, signal, toolCallId, context) {
        const body = response.body;
        if (!body) {
            throw new Error('Assistant SDK response has no body');
        }
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const state = {
            sdkSessionId: undefined,
            collectedTexts: [],
            hasCodeDiff: false,
            suggestionIds: [],
        };
        try {
            while (true) {
                if (signal?.aborted) {
                    break;
                }
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const segments = buffer.split(constants_1.STREAM_SEPARATOR);
                buffer = segments.pop() ?? '';
                for (const segment of segments) {
                    const trimmed = segment.trim();
                    if (!trimmed)
                        continue;
                    let chunk;
                    try {
                        chunk = JSON.parse(trimmed);
                    }
                    catch {
                        this.logger?.warn('[AssistantHandler] Failed to parse SDK stream segment', {
                            segment: trimmed.substring(0, 100),
                        });
                        continue;
                    }
                    await this.processChunkMessages(chunk, state, writer, toolCallId, context);
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        const remaining = buffer.trim();
        if (remaining) {
            try {
                const chunk = JSON.parse(remaining);
                await this.processChunkMessages(chunk, state, writer, toolCallId, context);
            }
            catch {
                throw new Error(`Assistant SDK error: ${remaining.substring(0, 500)}`);
            }
        }
        const responseText = state.collectedTexts.join('\n');
        const summary = responseText.length > SUMMARY_MAX_LENGTH
            ? responseText.substring(0, SUMMARY_MAX_LENGTH) + '...'
            : responseText;
        return {
            responseText,
            summary,
            sdkSessionId: state.sdkSessionId,
            hasCodeDiff: state.hasCodeDiff,
            suggestionIds: state.suggestionIds,
        };
    }
    async processChunkMessages(chunk, state, writer, toolCallId, context) {
        if (chunk.sessionId && !state.sdkSessionId) {
            state.sdkSessionId = chunk.sessionId;
        }
        for (const msg of chunk.messages) {
            const mapped = this.mapSdkMessage(msg, toolCallId, state.sdkSessionId, context);
            if (!mapped)
                continue;
            if (mapped.type === 'message' && 'text' in mapped && mapped.text) {
                state.collectedTexts.push(mapped.text);
            }
            else if (mapped.type === 'summary' && 'content' in mapped) {
                state.collectedTexts.push(`${mapped.title}\n${mapped.content}`);
            }
            else if (mapped.type === 'agent-suggestion' && 'text' in mapped) {
                state.collectedTexts.push(`${mapped.title}\n${mapped.text}`);
            }
            if (this.isSdkCodeDiff(msg)) {
                state.hasCodeDiff = true;
                if (msg.suggestionId) {
                    state.suggestionIds.push(msg.suggestionId);
                }
            }
            if (this.isSdkAgentSuggestion(msg) && msg.suggestionId) {
                state.suggestionIds.push(msg.suggestionId);
            }
            await writer(mapped);
        }
    }
    mapSdkMessage(msg, toolCallId, sdkSessionId, context) {
        if (this.isSdkText(msg)) {
            if (!msg.text)
                return null;
            const chunk = {
                role: 'assistant',
                type: 'message',
                text: msg.text,
            };
            if (msg.codeSnippet) {
                chunk.codeSnippet = msg.codeSnippet;
            }
            return chunk;
        }
        if (this.isSdkCodeDiff(msg)) {
            return {
                role: 'assistant',
                type: 'code-diff',
                suggestionId: msg.suggestionId ?? '',
                sdkSessionId: sdkSessionId ?? '',
                codeDiff: msg.codeDiff,
                description: msg.description,
                nodeName: context?.errorContext?.nodeName,
                quickReplies: msg.quickReplies,
            };
        }
        if (this.isSdkSummary(msg)) {
            return {
                role: 'assistant',
                type: 'summary',
                title: msg.title,
                content: msg.content,
            };
        }
        if (this.isSdkAgentSuggestion(msg)) {
            const chunk = {
                role: 'assistant',
                type: 'agent-suggestion',
                title: msg.title,
                text: msg.text,
            };
            if (msg.suggestionId) {
                chunk.suggestionId = msg.suggestionId;
            }
            return chunk;
        }
        if (this.isSdkIntermediateStep(msg)) {
            return {
                type: 'tool',
                toolName: 'assistant',
                toolCallId,
                status: 'running',
            };
        }
        if (this.isSdkEvent(msg)) {
            return null;
        }
        if (this.isSdkError(msg)) {
            return {
                role: 'assistant',
                type: 'message',
                text: msg.text,
            };
        }
        return null;
    }
    isSdkText(msg) {
        return msg.type === 'message' && 'text' in msg;
    }
    isSdkCodeDiff(msg) {
        return msg.type === 'code-diff' && 'codeDiff' in msg;
    }
    isSdkSummary(msg) {
        return msg.type === 'summary' && 'title' in msg;
    }
    isSdkAgentSuggestion(msg) {
        return msg.type === 'agent-suggestion' && 'title' in msg;
    }
    isSdkIntermediateStep(msg) {
        return msg.type === 'intermediate-step';
    }
    isSdkEvent(msg) {
        return msg.type === 'event';
    }
    isSdkError(msg) {
        return msg.type === 'error' && 'text' in msg;
    }
}
exports.AssistantHandler = AssistantHandler;
//# sourceMappingURL=assistant-handler.js.map