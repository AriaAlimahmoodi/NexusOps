"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSubgraphTools = executeSubgraphTools;
exports.extractUserRequest = extractUserRequest;
exports.createStandardShouldContinue = createStandardShouldContinue;
exports.extractToolMessagesForPersistence = extractToolMessagesForPersistence;
exports.filterOutSubgraphToolMessages = filterOutSubgraphToolMessages;
const messages_1 = require("@langchain/core/messages");
const langgraph_1 = require("@langchain/langgraph");
const cache_control_1 = require("./cache-control");
const langchain_1 = require("../types/langchain");
function hasValidOptionalField(obj, key, check) {
    if (!(key in obj) || obj[key] === undefined)
        return true;
    switch (check) {
        case 'array':
            return Array.isArray(obj[key]);
        case 'string':
            return typeof obj[key] === 'string';
        case 'number':
            return typeof obj[key] === 'number';
        case 'boolean':
            return typeof obj[key] === 'boolean';
    }
}
function isCommandUpdate(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value;
    return (hasValidOptionalField(obj, 'messages', 'array') &&
        hasValidOptionalField(obj, 'workflowOperations', 'array') &&
        hasValidOptionalField(obj, 'templateIds', 'array') &&
        hasValidOptionalField(obj, 'cachedTemplates', 'array') &&
        hasValidOptionalField(obj, 'bestPractices', 'string') &&
        hasValidOptionalField(obj, 'approvedDomains', 'array') &&
        hasValidOptionalField(obj, 'webFetchCount', 'number') &&
        hasValidOptionalField(obj, 'allDomainsApproved', 'boolean') &&
        hasValidOptionalField(obj, 'fetchedUrlContent', 'array'));
}
function collectToolResults(toolResults) {
    const collected = {
        messages: [],
        operations: [],
        templateIds: [],
        cachedTemplates: [],
        approvedDomains: [],
        fetchedUrlContent: [],
    };
    for (const result of toolResults) {
        if ((0, langgraph_1.isCommand)(result) && isCommandUpdate(result.update)) {
            mergeCommandUpdate(collected, result.update);
        }
        else if ((0, langchain_1.isBaseMessage)(result)) {
            collected.messages.push(result);
        }
    }
    return collected;
}
function mergeCommandUpdate(target, update) {
    if (update.messages)
        target.messages.push(...update.messages);
    if (update.workflowOperations)
        target.operations.push(...update.workflowOperations);
    if (update.templateIds)
        target.templateIds.push(...update.templateIds);
    if (update.cachedTemplates)
        target.cachedTemplates.push(...update.cachedTemplates);
    if (update.bestPractices)
        target.bestPractices = update.bestPractices;
    if (update.approvedDomains)
        target.approvedDomains.push(...update.approvedDomains);
    if (update.webFetchCount !== undefined)
        target.webFetchCount = update.webFetchCount;
    if (update.allDomainsApproved !== undefined)
        target.allDomainsApproved = update.allDomainsApproved;
    if (update.fetchedUrlContent)
        target.fetchedUrlContent.push(...update.fetchedUrlContent);
}
function buildStateUpdate(collected) {
    const stateUpdate = {};
    if (collected.messages.length > 0)
        stateUpdate.messages = collected.messages;
    if (collected.operations.length > 0)
        stateUpdate.workflowOperations = collected.operations;
    if (collected.templateIds.length > 0)
        stateUpdate.templateIds = collected.templateIds;
    if (collected.cachedTemplates.length > 0)
        stateUpdate.cachedTemplates = collected.cachedTemplates;
    if (collected.bestPractices)
        stateUpdate.bestPractices = collected.bestPractices;
    if (collected.approvedDomains.length > 0)
        stateUpdate.approvedDomains = collected.approvedDomains;
    if (collected.webFetchCount !== undefined)
        stateUpdate.webFetchCount = collected.webFetchCount;
    if (collected.allDomainsApproved !== undefined)
        stateUpdate.allDomainsApproved = collected.allDomainsApproved;
    if (collected.fetchedUrlContent.length > 0)
        stateUpdate.fetchedUrlContent = collected.fetchedUrlContent;
    return stateUpdate;
}
async function executeSubgraphTools(state, toolMap) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || !messages_1.AIMessage.isInstance(lastMessage) || !lastMessage.tool_calls?.length) {
        return {};
    }
    const toolResults = await Promise.all(lastMessage.tool_calls.map(async (toolCall) => {
        const tool = toolMap.get(toolCall.name);
        if (!tool) {
            return new messages_1.ToolMessage({
                content: `Tool ${toolCall.name} not found`,
                tool_call_id: toolCall.id ?? '',
            });
        }
        try {
            const result = await tool.invoke(toolCall.args ?? {}, {
                toolCall: {
                    id: toolCall.id,
                    name: toolCall.name,
                    args: toolCall.args ?? {},
                },
            });
            return result;
        }
        catch (error) {
            if ((0, langgraph_1.isGraphInterrupt)(error)) {
                throw error;
            }
            return new messages_1.ToolMessage({
                content: `Tool failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                tool_call_id: toolCall.id ?? '',
            });
        }
    }));
    const collected = collectToolResults(toolResults);
    return buildStateUpdate(collected);
}
function extractUserRequest(messages, defaultValue = '') {
    const humanMessages = messages.filter((m) => m instanceof messages_1.HumanMessage);
    const lastNonResumeMessage = [...humanMessages]
        .reverse()
        .find((msg) => msg.additional_kwargs?.resumeData === undefined);
    const lastUserMessage = lastNonResumeMessage ?? humanMessages[humanMessages.length - 1];
    return typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : defaultValue;
}
function createStandardShouldContinue() {
    return (state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        const hasToolCalls = lastMessage &&
            'tool_calls' in lastMessage &&
            Array.isArray(lastMessage.tool_calls) &&
            lastMessage.tool_calls.length > 0;
        return hasToolCalls ? 'tools' : langgraph_1.END;
    };
}
function extractToolMessagesForPersistence(messages) {
    const completedToolCallIds = new Set();
    for (const msg of messages) {
        if (messages_1.ToolMessage.isInstance(msg) && msg.tool_call_id) {
            completedToolCallIds.add(msg.tool_call_id);
        }
    }
    const filtered = messages.filter((msg) => {
        if (messages_1.ToolMessage.isInstance(msg)) {
            return true;
        }
        if (messages_1.AIMessage.isInstance(msg) && msg.tool_calls && msg.tool_calls.length > 0) {
            return msg.tool_calls.every((tc) => tc.id && completedToolCallIds.has(tc.id));
        }
        return false;
    });
    (0, cache_control_1.stripAllCacheControlMarkers)(filtered);
    return filtered;
}
function filterOutSubgraphToolMessages(messages) {
    return messages.filter((msg) => {
        if (messages_1.ToolMessage.isInstance(msg)) {
            return false;
        }
        if (messages_1.AIMessage.isInstance(msg) && msg.tool_calls && msg.tool_calls.length > 0) {
            return false;
        }
        return true;
    });
}
//# sourceMappingURL=subgraph-helpers.js.map