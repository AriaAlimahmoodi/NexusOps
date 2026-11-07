"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlackPlatformAgentContext = getSlackPlatformAgentContext;
exports.getSlackReplyExpectation = getSlackReplyExpectation;
exports.prepareSlackInboundText = prepareSlackInboundText;
exports.createSlackBridgeExecutionContext = createSlackBridgeExecutionContext;
exports.createSlackResumeExecutionContext = createSlackResumeExecutionContext;
const is_record_1 = require("@n8n/utils/is-record");
const sleep_1 = require("@n8n/utils/sleep");
const escapeRegExp_1 = __importDefault(require("lodash/escapeRegExp"));
const SLACK_THINKING_STATUS = 'Thinking...';
const SLACK_STATUS_RETRY_DELAY_MS = 750;
const SLACK_HISTORY_MAX_MESSAGES = 30;
const SLACK_HISTORY_MAX_CHARS = 8000;
const SLACK_HISTORY_MAX_MESSAGE_CHARS = 1500;
const SLACK_HISTORY_HEADER = 'Earlier messages in this Slack thread, for context (you were mentioned partway through the conversation):';
const SLACK_HISTORY_OPEN_TAG = '<slack_thread_history>';
const SLACK_HISTORY_CLOSE_TAG = '</slack_thread_history>';
const SLACK_HISTORY_FRAMING_CHARS = SLACK_HISTORY_HEADER.length + SLACK_HISTORY_OPEN_TAG.length + SLACK_HISTORY_CLOSE_TAG.length + 2;
function getSlackPlatformAgentContext(chat) {
    const adapter = chat.getAdapter('slack');
    if (!(0, is_record_1.isRecord)(adapter))
        return {};
    const agentUserId = stringValue(adapter.botUserId);
    return agentUserId ? { agentUserId } : {};
}
function getSlackReplyExpectation(params) {
    if (params.isNewMention || params.message.isMention === true)
        return 'required';
    const raw = params.message.raw;
    if (!(0, is_record_1.isRecord)(raw))
        return 'required';
    const channelType = stringValue(raw.channel_type);
    const channelId = stringValue(raw.channel);
    const isDm = channelType === 'im' || channelId?.startsWith('D') === true;
    if (isDm)
        return 'required';
    return 'optional';
}
function prepareSlackInboundText(text, context) {
    const trimmed = text.trim();
    if (!context.agentUserId)
        return trimmed;
    return stripSlackSelfMention(trimmed, context.agentUserId);
}
async function createSlackBridgeExecutionContext(params) {
    const platformAgentContext = getSlackPlatformAgentContext(params.chat);
    const slackThreadContext = getSlackThreadContext(params.message, params.integration.type === 'slack' &&
        params.integration.settings?.messagingExperience === 'agent');
    const shouldFetchHistory = params.isNewMention && slackThreadContext?.hasRealThreadTs === true;
    const [statusHandle, historyContext] = await Promise.all([
        params.startStatus === false || params.replyExpectation === 'optional'
            ? Promise.resolve(undefined)
            : startSlackThinkingStatus(params.thread, {
                chat: params.chat,
                logger: params.logger,
                agentId: params.agentId,
                slackThreadContext,
                statusRetry: params.statusRetry,
            }),
        shouldFetchHistory
            ? fetchSlackThreadHistory(params.thread, params.message, platformAgentContext, params.logger, params.agentId)
            : Promise.resolve(undefined),
    ]);
    return {
        platformAgentContext,
        slackThreadContext,
        forceBuffered: slackThreadContext?.canUseThreadTs !== true,
        statusHandle,
        ...(historyContext ? { historyContext } : {}),
    };
}
async function createSlackResumeExecutionContext(params) {
    return {
        forceBuffered: true,
        statusHandle: await startSlackThinkingStatus(params.thread, {
            chat: params.chat,
            logger: params.logger,
            agentId: params.agentId,
            slackThreadContext: params.slackThreadContext,
            statusRetry: new AbortController(),
        }),
    };
}
async function startSlackThinkingStatus(thread, options) {
    const { slackThreadContext, statusRetry } = options;
    if (slackThreadContext && !slackThreadContext.canUseThreadTs) {
        const setStatus = setSlackAssistantStatus(slackThreadContext, options);
        return {
            clearBeforeResponse: async () => {
                statusRetry?.abort();
                await setStatus;
                await clearSlackAssistantStatus(slackThreadContext, options);
            },
        };
    }
    try {
        await thread.startTyping(SLACK_THINKING_STATUS);
    }
    catch (error) {
        options.logger.warn('[AgentChatBridge] Failed to set Slack assistant status', {
            agentId: options.agentId,
            threadId: thread.id,
            error: error instanceof Error ? error.message : String(error),
        });
    }
    if (slackThreadContext) {
        return {
            clearBeforeResponse: async () => {
                await clearSlackAssistantStatus(slackThreadContext, options);
            },
        };
    }
    return undefined;
}
async function setSlackAssistantStatus(context, options) {
    const adapter = getSlackAssistantStatusAdapter(options.chat);
    if (!adapter)
        return;
    await setSlackAssistantStatusWithRetry(adapter, context, options);
}
async function clearSlackAssistantStatus(context, options) {
    const adapter = getSlackAssistantStatusAdapter(options.chat);
    if (!adapter)
        return;
    try {
        await adapter.setAssistantStatus(context.channelId, context.threadTs, '');
    }
    catch (error) {
        options.logger.warn('[AgentChatBridge] Failed to clear Slack assistant status', {
            agentId: options.agentId,
            channelId: context.channelId,
            threadTs: context.threadTs,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
async function setSlackAssistantStatusWithRetry(adapter, context, options) {
    try {
        await adapter.setAssistantStatus(context.channelId, context.threadTs, SLACK_THINKING_STATUS, [
            SLACK_THINKING_STATUS,
        ]);
        return;
    }
    catch (error) {
        if (getSlackErrorCode(error) !== 'invalid_thread_ts') {
            options.logger.warn('[AgentChatBridge] Failed to set Slack assistant status', {
                agentId: options.agentId,
                channelId: context.channelId,
                threadTs: context.threadTs,
                error: error instanceof Error ? error.message : String(error),
            });
            return;
        }
    }
    try {
        await (0, sleep_1.sleep)(SLACK_STATUS_RETRY_DELAY_MS, options.statusRetry?.signal);
    }
    catch {
        return;
    }
    if (options.statusRetry?.signal.aborted)
        return;
    try {
        await adapter.setAssistantStatus(context.channelId, context.threadTs, SLACK_THINKING_STATUS, [
            SLACK_THINKING_STATUS,
        ]);
    }
    catch (error) {
        const errorCode = getSlackErrorCode(error);
        const logPayload = {
            agentId: options.agentId,
            channelId: context.channelId,
            threadTs: context.threadTs,
            error: error instanceof Error ? error.message : String(error),
            ...(errorCode ? { errorCode } : {}),
        };
        if (errorCode === 'invalid_thread_ts') {
            options.logger.debug('[AgentChatBridge] Slack assistant status unavailable for thread', logPayload);
            return;
        }
        options.logger.warn('[AgentChatBridge] Failed to set Slack assistant status', logPayload);
    }
}
async function fetchSlackThreadHistory(thread, triggeringMessage, context, logger, agentId) {
    try {
        const triggeringMessageId = triggeringMessage.id;
        const collected = [];
        let totalChars = SLACK_HISTORY_FRAMING_CHARS;
        for await (const message of thread.messages) {
            if (collected.length >= SLACK_HISTORY_MAX_MESSAGES)
                break;
            if (message.id === triggeringMessageId)
                continue;
            const text = typeof message.text === 'string' ? message.text.trim() : '';
            if (!text)
                continue;
            const line = formatSlackHistoryLine(message, text, context);
            const lineCost = line.length + 1;
            if (totalChars + lineCost > SLACK_HISTORY_MAX_CHARS)
                break;
            collected.push(line);
            totalChars += lineCost;
        }
        if (collected.length === 0)
            return undefined;
        const chronological = collected.reverse();
        return [
            SLACK_HISTORY_HEADER,
            SLACK_HISTORY_OPEN_TAG,
            ...chronological,
            SLACK_HISTORY_CLOSE_TAG,
        ].join('\n');
    }
    catch (error) {
        logger.warn('[AgentChatBridge] Failed to fetch Slack thread history', {
            agentId,
            threadId: thread.id,
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
}
function formatSlackHistoryLine(message, text, context) {
    const author = message.author;
    const label = author.userId && context.agentUserId && author.userId === context.agentUserId
        ? 'you (the agent)'
        : (author.userName ?? author.userId ?? 'unknown');
    const safeText = sanitizeSlackHistoryText(text);
    const truncatedText = safeText.length > SLACK_HISTORY_MAX_MESSAGE_CHARS
        ? `${safeText.slice(0, SLACK_HISTORY_MAX_MESSAGE_CHARS)}…`
        : safeText;
    return `[${label}]: ${truncatedText}`;
}
function sanitizeSlackHistoryText(text) {
    return text.replace(/<(\/?)(slack_thread_history)\s*>/gi, (_m, slash, name) => `[${slash}${name}]`);
}
function getSlackThreadContext(message, usesAgentMessagingExperience) {
    const raw = message.raw;
    if (!(0, is_record_1.isRecord)(raw))
        return undefined;
    const channelId = stringValue(raw.channel);
    const realThreadTs = stringValue(raw.thread_ts);
    const threadTs = realThreadTs ?? stringValue(raw.ts);
    if (!channelId || !threadTs)
        return undefined;
    const channelType = stringValue(raw.channel_type);
    const isDm = channelType === 'im' || channelId.startsWith('D');
    return {
        channelId,
        threadTs,
        hasRealThreadTs: realThreadTs !== undefined,
        canUseThreadTs: realThreadTs !== undefined || (usesAgentMessagingExperience && isDm),
        recipientTeamId: stringValue(raw.team_id) ?? stringValue(raw.team),
    };
}
function getSlackAssistantStatusAdapter(chat) {
    const adapter = chat.getAdapter('slack');
    return isSlackAssistantStatusAdapter(adapter) ? adapter : undefined;
}
function stripSlackSelfMention(text, userId) {
    const escapedUserId = (0, escapeRegExp_1.default)(userId);
    return text
        .replace(new RegExp(`(^|\\s)<@!?${escapedUserId}(?:\\|[^>]+)?>`, 'gi'), '$1')
        .replace(new RegExp(`(^|\\s)@${escapedUserId}\\b`, 'gi'), '$1')
        .replace(/\s+/g, ' ')
        .trim();
}
function isSlackAssistantStatusAdapter(value) {
    return (0, is_record_1.isRecord)(value) && typeof value.setAssistantStatus === 'function';
}
function stringValue(value) {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function getSlackErrorCode(error) {
    if (!(0, is_record_1.isRecord)(error))
        return undefined;
    const data = error.data;
    if (!(0, is_record_1.isRecord)(data))
        return undefined;
    return stringValue(data.error);
}
//# sourceMappingURL=slack-bridge-behavior.js.map