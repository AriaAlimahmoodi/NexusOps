"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatIntegrationActionExecutor = exports.respondInputSchema = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const zod_1 = require("zod");
const agent_chat_integration_1 = require("./agent-chat-integration");
const chat_integration_service_1 = require("./chat-integration.service");
const component_mapper_1 = require("./component-mapper");
const integration_error_codes_1 = require("./integration-error-codes");
const integration_helpers_1 = require("./integration-helpers");
const channel_rate_limit_guard_1 = require("./channel-rate-limit.guard");
const channel_rate_limit_1 = require("./channel-rate-limit");
const messageSchema = api_types_1.richMessageSchema;
exports.respondInputSchema = zod_1.z.object({ message: messageSchema });
const sendDmInputSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    message: messageSchema,
});
const sendChannelMessageInputSchema = zod_1.z.object({
    channelId: zod_1.z.string().min(1),
    message: messageSchema,
});
const editMessageInputSchema = zod_1.z
    .object({
    messageId: zod_1.z.string().min(1),
    message: messageSchema,
})
    .strict();
const addReactionInputSchema = zod_1.z.object({
    emoji: zod_1.z.string().min(1),
    threadId: zod_1.z.string().min(1).optional(),
    messageId: zod_1.z.string().min(1).optional(),
});
let ChatIntegrationActionExecutor = class ChatIntegrationActionExecutor {
    constructor(chatIntegrationService, integrationRegistry, channelRateLimitGuard) {
        this.chatIntegrationService = chatIntegrationService;
        this.integrationRegistry = integrationRegistry;
        this.channelRateLimitGuard = channelRateLimitGuard;
        this.componentMapper = new component_mapper_1.ComponentMapper();
    }
    async execute(params) {
        if (!params.descriptor.agentId)
            return (0, integration_helpers_1.connectionUnavailable)();
        if (params.action === 'do_not_respond') {
            return this.doNotRespond(params);
        }
        if (this.channelRateLimitGuard.isBlocked(params.descriptor.integrationConnectionId)) {
            return (0, integration_helpers_1.rateLimitExceeded)((0, channel_rate_limit_1.channelRateLimitMessage)(params.descriptor.integration.type));
        }
        const unsupportedAction = () => (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.UNSUPPORTED_ACTION, `The ${params.descriptor.integration.type} integration does not support ${params.action}.`);
        const integrationDef = this.integrationRegistry.get(params.descriptor.integration.type);
        if (integrationDef && !integrationDef.requiresChatInstance) {
            if (!integrationDef.executeAction) {
                return unsupportedAction();
            }
            try {
                const result = await integrationDef.executeAction({
                    chat: undefined,
                    descriptor: params.descriptor,
                    action: params.action,
                    input: params.input,
                    currentMessageContext: params.currentMessageContext,
                });
                return result ?? unsupportedAction();
            }
            catch (error) {
                return (0, channel_rate_limit_1.caughtIntegrationError)(error, {
                    connectionId: params.descriptor.integrationConnectionId,
                    platform: params.descriptor.integration.type,
                    guard: this.channelRateLimitGuard,
                    failedCode: integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_FAILED,
                });
            }
        }
        const { credentialId } = params.descriptor.integration;
        if (!credentialId)
            return (0, integration_helpers_1.connectionUnavailable)();
        const chat = await this.chatIntegrationService.getChatInstanceForTools(params.descriptor.agentId, params.descriptor.integration);
        if (!chat)
            return (0, integration_helpers_1.connectionUnavailable)();
        try {
            if (params.action === 'respond') {
                return await this.respondInCurrentThread(chat, params);
            }
            if (params.action === 'send_dm') {
                return await this.sendDirectMessage(chat, params);
            }
            if (params.action === 'edit_message') {
                return await this.editMessageInCurrentThread(chat, params);
            }
            if (params.action === 'add_reaction') {
                return await this.addReactionToMessage(chat, params);
            }
            if (integrationDef?.executeAction) {
                const result = await integrationDef.executeAction({
                    chat,
                    descriptor: params.descriptor,
                    action: params.action,
                    input: params.input,
                    currentMessageContext: params.currentMessageContext,
                });
                if (result !== undefined)
                    return result;
            }
            if (params.action === 'send_channel_message') {
                return await this.sendChannelMessage(chat, params);
            }
            return unsupportedAction();
        }
        catch (error) {
            const described = integrationDef?.describeActionError?.(params.action, error);
            if (described)
                return (0, integration_helpers_1.integrationError)(described.code, described.message);
            return (0, channel_rate_limit_1.caughtIntegrationError)(error, {
                connectionId: params.descriptor.integrationConnectionId,
                platform: params.descriptor.integration.type,
                guard: this.channelRateLimitGuard,
                failedCode: integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_FAILED,
            });
        }
    }
    doNotRespond(params) {
        if (params.currentMessageContext?.replyExpectation !== 'optional') {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.REPLY_REQUIRED, 'A reply is expected here — this is a direct message, a direct mention, or a conversation you were asked to join. Respond normally instead of staying silent.');
        }
        return {
            ok: true,
            silent: true,
            note: 'No reply will be sent. End your turn now without writing any text.',
        };
    }
    async addReactionToMessage(chat, params) {
        const adapter = chat.getAdapter(params.descriptor.integration.type);
        if (!supportsAddReaction(adapter)) {
            return (0, integration_helpers_1.unsupportedAction)(params.descriptor.integration.type, 'add_reaction');
        }
        const input = addReactionInputSchema.parse(params.input);
        const currentMessageContext = params.currentMessageContext;
        const replyTargetForReaction = input.messageId !== undefined &&
            input.messageId === currentMessageContext?.replyMessageId &&
            (input.threadId === undefined ||
                input.threadId === currentMessageContext.replyTarget?.threadId)
            ? currentMessageContext.replyTarget
            : undefined;
        const fallbackTarget = replyTargetForReaction ?? currentMessageContext?.target;
        const threadId = input.threadId ?? fallbackTarget?.threadId;
        const messageId = input.messageId ?? currentMessageContext?.messageId;
        if (!threadId || !messageId) {
            const platform = params.descriptor.integration.type;
            const displayLabel = `${platform.charAt(0).toUpperCase()}${platform.slice(1)}`;
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT, `${displayLabel} reactions require a messageId and threadId or current message context.`);
        }
        await adapter.addReaction(threadId, messageId, input.emoji);
        return {
            ok: true,
            reaction: { emoji: input.emoji, threadId, messageId },
            messageContext: {
                integrationConnectionId: params.descriptor.integrationConnectionId,
                platform: params.descriptor.integration.type,
                target: replyTargetForReaction && currentMessageContext
                    ? currentMessageContext.target
                    : buildReactionTarget(params.descriptor.integration.type, threadId, fallbackTarget),
                messageId: replyTargetForReaction && currentMessageContext
                    ? currentMessageContext.messageId
                    : messageId,
                updatedAt: new Date().toISOString(),
            },
        };
    }
    async respondInCurrentThread(chat, params) {
        const input = exports.respondInputSchema.parse(params.input);
        const threadId = params.currentMessageContext?.target.threadId;
        if (!threadId) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT, 'There is no current message context. Use an explicit send action.');
        }
        const replyTargetThreadId = params.currentMessageContext?.replyTarget?.threadId;
        const isAutomaticReplyTarget = params.currentMessageContext?.replyExpectation !== undefined &&
            (replyTargetThreadId === undefined || replyTargetThreadId === threadId);
        if (!input.message.card && isAutomaticReplyTarget) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_FAILED, 'Plain text is already delivered to this conversation as your normal reply — write the text directly in your reply instead of calling respond. Call respond only with message.card, or use an explicit send action for a different target.');
        }
        const thread = chat.thread(threadId);
        await this.prepareSentThread(params.descriptor, thread);
        const sent = await thread.post(await this.toPostable(params.descriptor, input.message, params));
        return {
            ok: true,
            messageContext: buildMessageContextFromSentMessage({
                descriptor: params.descriptor,
                sent,
                target: params.currentMessageContext.target,
            }),
        };
    }
    async sendDirectMessage(chat, params) {
        const input = sendDmInputSchema.parse(params.input);
        const adapter = chat.getAdapter(params.descriptor.integration.type);
        const thread = supportsOpenDM(adapter)
            ? chat.thread(await adapter.openDM(input.userId))
            : await chat.openDM(input.userId);
        const sent = await thread.post(await this.toPostable(params.descriptor, input.message, params));
        const anchoredId = this.sentThreadId(params.descriptor, sent);
        const threadId = anchoredId ?? thread.id;
        const targetThread = anchoredId && anchoredId !== thread.id ? chat.thread(threadId) : thread;
        await this.prepareSentThread(params.descriptor, targetThread);
        return {
            ok: true,
            messageContext: buildMessageContextFromSentMessage({
                descriptor: params.descriptor,
                sent,
                target: { type: 'dm', userId: input.userId, threadId },
            }),
        };
    }
    async editMessageInCurrentThread(chat, params) {
        const input = editMessageInputSchema.parse(params.input);
        const currentMessageContext = params.currentMessageContext;
        const threadId = currentMessageContext?.target.threadId;
        if (!currentMessageContext || !threadId) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.NO_MESSAGE_CONTEXT, 'There is no current conversation to edit. Send a message first, then try again.');
        }
        const adapter = chat.getAdapter(params.descriptor.integration.type);
        if (!supportsMessageEditing(adapter)) {
            return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.UNSUPPORTED_ACTION, `The ${params.descriptor.integration.type} integration can't edit messages. Use a supported action instead.`);
        }
        const edited = await adapter.editMessage(threadId, input.messageId, await this.toPostable(params.descriptor, input.message, params));
        return {
            ok: true,
            messageContext: {
                ...currentMessageContext,
                messageId: edited.id,
                updatedAt: new Date().toISOString(),
            },
        };
    }
    async sendChannelMessage(chat, params) {
        const input = sendChannelMessageInputSchema.parse(params.input);
        const platform = params.descriptor.integration.type;
        const channelId = this.integrationRegistry
            .get(platform)
            ?.normalizeChannelId(input.channelId, chat.getAdapter(platform)) ??
            (0, integration_helpers_1.normalizePlatformId)(platform, input.channelId);
        const channel = chat.channel(channelId);
        const sent = await channel.post(await this.toPostable(params.descriptor, input.message, params));
        const threadId = this.sentThreadId(params.descriptor, sent);
        if (threadId) {
            await this.prepareSentThread(params.descriptor, chat.thread(threadId));
        }
        return {
            ok: true,
            messageContext: buildMessageContextFromSentMessage({
                descriptor: params.descriptor,
                sent,
                target: { type: 'channel', channelId, threadId },
            }),
        };
    }
    async toPostable(descriptor, message, params) {
        const cardPayload = message.card;
        if (!cardPayload)
            return message.text ?? '';
        if (params.awaitResponse && (!params.runId || !params.toolCallId)) {
            throw new Error('Interactive integration actions require runId and toolCallId.');
        }
        const card = await this.componentMapper.toCard({
            title: cardPayload.title ?? message.text,
            message: cardPayload.message,
            components: cardPayload.components,
        }, params.runId ?? '', params.toolCallId ?? '', component_mapper_1.INTERACTIVE_CARD_RESUME_JSON_SCHEMA, this.getShortenCallback(descriptor, params.runId && params.toolCallId
            ? { groupId: JSON.stringify([params.runId, params.toolCallId]) }
            : undefined), descriptor.integration.type);
        return { card };
    }
    getShortenCallback(descriptor, metadata) {
        const { agentId, integration } = descriptor;
        if (!agentId)
            return undefined;
        const { credentialId } = integration;
        if (!credentialId)
            return undefined;
        return this.chatIntegrationService.getShortenCallback(agentId, { type: integration.type, credentialId }, metadata);
    }
    async prepareSentThread(descriptor, thread) {
        if (descriptor.integration.credentialId === undefined)
            return;
        await this.integrationRegistry
            .get(descriptor.integration.type)
            ?.prepareSentThread?.(thread, descriptor.integration);
    }
    sentThreadId(descriptor, sent) {
        if (!sent.threadId)
            return undefined;
        const integration = this.integrationRegistry.get(descriptor.integration.type);
        return (integration?.messageThreadId?.({ id: sent.id, threadId: sent.threadId }) ?? sent.threadId);
    }
};
exports.ChatIntegrationActionExecutor = ChatIntegrationActionExecutor;
exports.ChatIntegrationActionExecutor = ChatIntegrationActionExecutor = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [chat_integration_service_1.ChatIntegrationService, agent_chat_integration_1.ChatIntegrationRegistry, channel_rate_limit_guard_1.ChannelRateLimitGuard])
], ChatIntegrationActionExecutor);
function supportsMessageEditing(adapter) {
    return (0, is_record_1.isRecord)(adapter) && typeof adapter.editMessage === 'function';
}
function supportsOpenDM(adapter) {
    return (0, is_record_1.isRecord)(adapter) && typeof adapter.openDM === 'function';
}
function supportsAddReaction(adapter) {
    return (0, is_record_1.isRecord)(adapter) && typeof adapter.addReaction === 'function';
}
function buildMessageContextFromSentMessage(params) {
    return {
        integrationConnectionId: params.descriptor.integrationConnectionId,
        platform: params.descriptor.integration.type,
        target: params.target,
        messageId: params.sent.id,
        updatedAt: new Date().toISOString(),
    };
}
function buildReactionTarget(platform, threadId, fallbackTarget) {
    if (fallbackTarget?.threadId === threadId)
        return fallbackTarget;
    const [threadPlatform, channel] = threadId.split(':');
    const channelId = platform === 'slack' && threadPlatform === 'slack' && channel
        ? `${threadPlatform}:${channel}`
        : undefined;
    return { type: 'thread', threadId, ...(channelId ? { channelId } : {}) };
}
//# sourceMappingURL=integration-action-executor.js.map