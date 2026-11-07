"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentChatMessageContextBridge = void 0;
const integration_tools_1 = require("./integration-tools");
class AgentChatMessageContextBridge {
    constructor(messageContextStore, integration, agentId, logger) {
        this.messageContextStore = messageContextStore;
        this.integration = integration;
        this.agentId = agentId;
        this.logger = logger;
    }
    capture(thread, options = {}) {
        const integrationConnectionId = (0, integration_tools_1.buildIntegrationConnectionId)(this.integration);
        const agentUserId = options.agentUserId;
        const target = {
            type: 'thread',
            threadId: thread.id,
            channelId: thread.channelId,
        };
        const context = {
            integrationConnectionId,
            platform: this.integration.type,
            target,
            ...(options.messageId ? { messageId: options.messageId } : {}),
            ...(options.interactingUserId ? { interactingUserId: options.interactingUserId } : {}),
            ...(agentUserId ? { agentUserId } : {}),
            ...(options.platformMessage ? { platformMessage: options.platformMessage } : {}),
            ...(options.subject ? { subject: options.subject } : {}),
            ...(options.replyExpectation
                ? {
                    replyExpectation: options.replyExpectation,
                    replyTarget: target,
                    ...(options.messageId ? { replyMessageId: options.messageId } : {}),
                }
                : {}),
            updatedAt: new Date().toISOString(),
        };
        return context;
    }
    async resolveSubject(message) {
        try {
            return toIntegrationMessageSubject(await message.subject);
        }
        catch (error) {
            this.logger.debug(`[AgentChatBridge] Failed to fetch message subject: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }
    async resolveSession(threadId) {
        if (!this.messageContextStore)
            return null;
        try {
            return await this.messageContextStore.resolveSession(threadId);
        }
        catch (error) {
            this.logger.warn('[AgentChatBridge] Failed to resolve session binding', {
                agentId: this.agentId,
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    async unbindSession(threadId) {
        if (!this.messageContextStore)
            return;
        await this.messageContextStore.unbindSession(threadId);
    }
}
exports.AgentChatMessageContextBridge = AgentChatMessageContextBridge;
function toIntegrationMessageSubject(subject) {
    if (!subject || typeof subject.type !== 'string' || typeof subject.id !== 'string') {
        return undefined;
    }
    const assignee = toIntegrationSubjectPerson(subject.assignee);
    const author = toIntegrationSubjectPerson(subject.author);
    const labels = subject.labels?.filter((label) => typeof label === 'string');
    return {
        type: subject.type,
        id: subject.id,
        ...(typeof subject.title === 'string' ? { title: subject.title } : {}),
        ...(typeof subject.description === 'string' ? { description: subject.description } : {}),
        ...(typeof subject.url === 'string' ? { url: subject.url } : {}),
        ...(typeof subject.status === 'string' ? { status: subject.status } : {}),
        ...(labels && labels.length > 0 ? { labels } : {}),
        ...(assignee ? { assignee } : {}),
        ...(author ? { author } : {}),
    };
}
function toIntegrationSubjectPerson(person) {
    if (!person || typeof person.id !== 'string' || typeof person.name !== 'string') {
        return undefined;
    }
    return {
        id: person.id,
        name: person.name,
    };
}
//# sourceMappingURL=agent-chat-message-context.js.map