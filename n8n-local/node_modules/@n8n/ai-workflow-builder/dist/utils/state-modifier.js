"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineStateAction = determineStateAction;
exports.handleCleanupDangling = handleCleanupDangling;
exports.handleCompactMessages = handleCompactMessages;
exports.handleDeleteMessages = handleDeleteMessages;
exports.handleClearErrorState = handleClearErrorState;
exports.handleCreateWorkflowName = handleCreateWorkflowName;
const messages_1 = require("@langchain/core/messages");
const cleanup_dangling_tool_call_messages_1 = require("./cleanup-dangling-tool-call-messages");
const token_usage_1 = require("./token-usage");
const conversation_compact_1 = require("../chains/conversation-compact");
const workflow_name_1 = require("../chains/workflow-name");
const coordination_1 = require("../types/coordination");
function hasUnclearedRecursionError(coordinationLog) {
    let lastRecursionErrorIndex = -1;
    for (let i = coordinationLog.length - 1; i >= 0; i--) {
        const entry = coordinationLog[i];
        if (entry.status !== 'error')
            continue;
        const errorMessage = entry.summary.toLowerCase();
        if (errorMessage.includes('recursion') ||
            errorMessage.includes('maximum number of steps') ||
            errorMessage.includes('iteration limit')) {
            lastRecursionErrorIndex = i;
            break;
        }
    }
    if (lastRecursionErrorIndex >= 0) {
        const hasAlreadyCleared = coordinationLog
            .slice(lastRecursionErrorIndex + 1)
            .some((entry) => entry.phase === 'state_management' &&
            entry.summary.includes('Cleared') &&
            entry.summary.includes('recursion'));
        return !hasAlreadyCleared;
    }
    return false;
}
function determineStateAction(input, autoCompactThresholdTokens) {
    const { messages, coordinationLog } = input;
    const danglingMessages = (0, cleanup_dangling_tool_call_messages_1.cleanupDanglingToolCallMessages)(messages);
    if (danglingMessages.length > 0) {
        return 'cleanup_dangling';
    }
    const lastHumanMessage = messages.findLast((m) => m instanceof messages_1.HumanMessage);
    if (!lastHumanMessage)
        return 'continue';
    if (coordinationLog && hasUnclearedRecursionError(coordinationLog)) {
        return 'clear_error_state';
    }
    if (lastHumanMessage.content === '/compact') {
        return 'compact_messages';
    }
    if (lastHumanMessage.content === '/clear') {
        return 'delete_messages';
    }
    const estimatedTokens = (0, token_usage_1.estimateTokenCountFromMessages)(messages);
    if (estimatedTokens > autoCompactThresholdTokens) {
        return 'auto_compact_messages';
    }
    return 'continue';
}
function handleCleanupDangling(messages, logger) {
    const messagesToRemove = (0, cleanup_dangling_tool_call_messages_1.cleanupDanglingToolCallMessages)(messages);
    if (messagesToRemove.length > 0) {
        logger?.warn('Cleaning up dangling tool call messages', {
            count: messagesToRemove.length,
        });
    }
    return { messages: messagesToRemove };
}
async function handleCompactMessages(messages, previousSummary, llm, isAutoCompact, config) {
    const lastHumanMessage = messages.findLast((m) => m instanceof messages_1.HumanMessage);
    if (!lastHumanMessage) {
        throw new Error('Cannot compact messages: no HumanMessage found');
    }
    const compactedMessages = await (0, conversation_compact_1.conversationCompactChain)(llm, messages, previousSummary, config);
    const newMessages = [
        ...messages.map((m) => new messages_1.RemoveMessage({ id: m.id })),
        ...(isAutoCompact ? [new messages_1.HumanMessage({ content: lastHumanMessage.content })] : []),
    ];
    return {
        previousSummary: compactedMessages.summaryPlain,
        messages: newMessages,
        coordinationLog: [
            {
                phase: 'state_management',
                status: 'completed',
                timestamp: Date.now(),
                summary: isAutoCompact
                    ? 'Auto-compacted conversation due to token limit'
                    : 'Manually compacted conversation history',
                metadata: (0, coordination_1.createStateManagementMetadata)({
                    action: 'compact',
                    messagesRemoved: messages.length,
                }),
            },
        ],
    };
}
function handleDeleteMessages(messages) {
    return {
        messages: messages.map((m) => new messages_1.RemoveMessage({ id: m.id })),
        workflowJSON: { nodes: [], connections: {}, name: '' },
        previousSummary: '',
        discoveryContext: null,
        coordinationLog: [
            {
                phase: 'state_management',
                status: 'completed',
                timestamp: Date.now(),
                summary: 'Cleared session and reset workflow',
                metadata: (0, coordination_1.createStateManagementMetadata)({ action: 'clear' }),
            },
        ],
        workflowOperations: [],
    };
}
function handleClearErrorState(coordinationLog, logger) {
    const errorCount = coordinationLog.filter((entry) => entry.status === 'error').length;
    if (errorCount > 0) {
        logger?.info('Marking error state as cleared to allow continuation', { errorCount });
    }
    return {
        coordinationLog: [
            {
                phase: 'state_management',
                status: 'completed',
                timestamp: Date.now(),
                summary: `Cleared ${errorCount} recursion error ${errorCount === 1 ? 'entry' : 'entries'} to allow continuation`,
                metadata: (0, coordination_1.createStateManagementMetadata)({ action: 'clear' }),
            },
        ],
    };
}
async function handleCreateWorkflowName(messages, workflowJSON, llm, logger, config) {
    const workflowName = workflowJSON?.name;
    const isDefaultName = !workflowName || /^My workflow( \d+)?$/.test(workflowName);
    if (!isDefaultName || (workflowJSON?.nodes?.length ?? 0) > 0) {
        return { workflowJSON };
    }
    const lastHumanMessage = messages.findLast((m) => m instanceof messages_1.HumanMessage);
    if (!lastHumanMessage || typeof lastHumanMessage.content !== 'string') {
        logger?.debug('No suitable human message found, skipping workflow name generation');
        return { workflowJSON };
    }
    logger?.debug('Generating workflow name');
    const { name } = await (0, workflow_name_1.workflowNameChain)(llm, lastHumanMessage.content, config);
    return {
        workflowJSON: { ...workflowJSON, name },
    };
}
//# sourceMappingURL=state-modifier.js.map