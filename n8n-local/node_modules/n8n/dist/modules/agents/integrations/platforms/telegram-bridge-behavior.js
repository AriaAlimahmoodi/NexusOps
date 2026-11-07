"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTelegramBridgeExecutionContext = createTelegramBridgeExecutionContext;
exports.getTelegramPlatformMessageContext = getTelegramPlatformMessageContext;
exports.createTelegramResumeExecutionContext = createTelegramResumeExecutionContext;
exports.startTelegramTypingIndicator = startTelegramTypingIndicator;
const is_record_1 = require("@n8n/utils/is-record");
const typing_indicator_1 = require("./typing-indicator");
const TELEGRAM_TYPING_REFRESH_MS = 4000;
function createTelegramBridgeExecutionContext(params) {
    const platformMessage = getTelegramPlatformMessageContext(params.message);
    return {
        platformAgentContext: {},
        ...(platformMessage ? { platformMessage } : {}),
        statusHandle: params.startStatus === false
            ? undefined
            : startTelegramTypingIndicator(params.thread, {
                logger: params.logger,
                agentId: params.agentId,
            }),
    };
}
function getTelegramPlatformMessageContext(message) {
    if (!(0, is_record_1.isRecord)(message.raw) || !(0, is_record_1.isRecord)(message.raw.chat))
        return undefined;
    const chatId = toTelegramId(message.raw.chat.id);
    const messageId = toTelegramId(message.raw.message_id);
    if (!chatId || !messageId)
        return undefined;
    const messageThreadId = toTelegramId(message.raw.message_thread_id);
    const attachments = (message.attachments ?? []).flatMap((attachment) => {
        const fileId = attachment.fetchMetadata?.fileId;
        if (!fileId)
            return [];
        const fileUniqueId = attachment.fetchMetadata?.fileUniqueId;
        return [
            {
                type: attachment.type,
                file_id: fileId,
                ...(fileUniqueId ? { file_unique_id: fileUniqueId } : {}),
            },
        ];
    });
    return {
        type: 'telegram',
        chat_id: chatId,
        message_id: messageId,
        ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
        attachments,
    };
}
function toTelegramId(value) {
    if (typeof value === 'string' && value.length > 0)
        return value;
    if (typeof value === 'number' && Number.isSafeInteger(value))
        return String(value);
    return undefined;
}
function createTelegramResumeExecutionContext(params) {
    return {
        statusHandle: startTelegramTypingIndicator(params.thread, {
            logger: params.logger,
            agentId: params.agentId,
        }),
    };
}
function startTelegramTypingIndicator(thread, options) {
    return (0, typing_indicator_1.startTypingIndicator)(thread, {
        ...options,
        platform: 'Telegram',
        refreshMs: TELEGRAM_TYPING_REFRESH_MS,
    });
}
//# sourceMappingURL=telegram-bridge-behavior.js.map