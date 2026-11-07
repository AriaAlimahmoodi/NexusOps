"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionChatHandler = void 0;
const code_builder_session_1 = require("../utils/code-builder-session");
function isSessionMessagesChunk(chunk) {
    return chunk.type === 'session-messages' && 'messages' in chunk;
}
class SessionChatHandler {
    checkpointer;
    llm;
    logger;
    onGenerationSuccess;
    constructor(config) {
        this.checkpointer = config.checkpointer;
        this.llm = config.llm;
        this.logger = config.logger;
        this.onGenerationSuccess = config.onGenerationSuccess;
    }
    buildHistoryContext(session) {
        if (session.conversationEntries.length > 0 || session.previousSummary) {
            return {
                conversationEntries: session.conversationEntries,
                previousSummary: session.previousSummary,
            };
        }
        return undefined;
    }
    processChunk(chunk) {
        let generationSucceeded = false;
        let sessionMessages;
        if (chunk.messages?.some((msg) => msg.type === 'workflow-updated')) {
            generationSucceeded = true;
        }
        for (const msg of chunk.messages ?? []) {
            if (isSessionMessagesChunk(msg)) {
                sessionMessages = msg.messages;
            }
        }
        const filteredMessages = chunk.messages?.filter((msg) => msg.type !== 'session-messages');
        return { generationSucceeded, sessionMessages, filteredMessages };
    }
    async *execute(params) {
        const { payload, userId, abortSignal, agentChat } = params;
        const workflowId = payload.workflowContext?.currentWorkflow?.id;
        if (!workflowId) {
            this.logger?.debug('No workflow ID, skipping session management');
            yield* agentChat(payload, userId, abortSignal);
            return;
        }
        const threadId = (0, code_builder_session_1.generateCodeBuilderThreadId)(workflowId, userId);
        let session = await (0, code_builder_session_1.loadCodeBuilderSession)(this.checkpointer, threadId);
        this.logger?.debug('Loaded CodeBuilder session', {
            threadId,
            conversationEntriesCount: session.conversationEntries.length,
            hasPreviousSummary: !!session.previousSummary,
        });
        session = await (0, code_builder_session_1.compactSessionIfNeeded)(session, this.llm);
        const historyContext = this.buildHistoryContext(session);
        let generationSucceeded = false;
        let sessionMessages;
        for await (const chunk of agentChat(payload, userId, abortSignal, historyContext)) {
            const result = this.processChunk(chunk);
            if (result.generationSucceeded)
                generationSucceeded = true;
            if (result.sessionMessages)
                sessionMessages = result.sessionMessages;
            if (result.filteredMessages && result.filteredMessages.length > 0) {
                yield { messages: result.filteredMessages };
            }
        }
        session.conversationEntries.push({ type: 'build-request', message: payload.message });
        await (0, code_builder_session_1.saveCodeBuilderSession)(this.checkpointer, threadId, session);
        if (generationSucceeded && sessionMessages) {
            await (0, code_builder_session_1.saveSessionMessages)(this.checkpointer, workflowId, userId, sessionMessages, payload.versionId, payload.id);
            this.logger?.debug('Saved session messages to SessionManager thread', {
                workflowId,
                userId,
                messageCount: sessionMessages.length,
            });
        }
        if (generationSucceeded && this.onGenerationSuccess) {
            try {
                await this.onGenerationSuccess();
            }
            catch (error) {
                this.logger?.warn('Failed to execute onGenerationSuccess callback', { error });
            }
        }
        this.logger?.debug('Saved CodeBuilder session', {
            threadId,
            newEntryCount: session.conversationEntries.length,
        });
    }
}
exports.SessionChatHandler = SessionChatHandler;
//# sourceMappingURL=session-chat-handler.js.map