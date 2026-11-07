"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threadMemoryResourceId = threadMemoryResourceId;
exports.episodicMemoryWriteScopeId = episodicMemoryWriteScopeId;
exports.draftChatMemoryResourceId = draftChatMemoryResourceId;
exports.productionChatMemoryResourceId = productionChatMemoryResourceId;
exports.systemChatMemoryResourceId = systemChatMemoryResourceId;
exports.userIdFromSystemChatMemoryResourceId = userIdFromSystemChatMemoryResourceId;
exports.userIdFromProductionChatMemoryResourceId = userIdFromProductionChatMemoryResourceId;
exports.userIdFromDraftChatMemoryResourceId = userIdFromDraftChatMemoryResourceId;
exports.integrationTypeFromMemoryResourceId = integrationTypeFromMemoryResourceId;
exports.integrationMemoryResourceId = integrationMemoryResourceId;
exports.isIntegrationMemoryResourceId = isIntegrationMemoryResourceId;
exports.taskRunMemoryResourceId = taskRunMemoryResourceId;
exports.isTaskRunMemoryResourceId = isTaskRunMemoryResourceId;
const INTEGRATION_MEMORY_RESOURCE_PREFIX = 'integration:';
const DRAFT_CHAT_MEMORY_RESOURCE_PREFIX = 'draft-chat:';
const PRODUCTION_CHAT_MEMORY_RESOURCE_PREFIX = 'n8n-chat-production:';
const SYSTEM_CHAT_MEMORY_RESOURCE_PREFIX = 'system-chat:';
const THREAD_MEMORY_RESOURCE_PREFIX = 'thread:';
function threadMemoryResourceId(threadId) {
    return `${THREAD_MEMORY_RESOURCE_PREFIX}${threadId}`;
}
function episodicMemoryWriteScopeId(scope) {
    return isIntegrationMemoryResourceId(scope.resourceId)
        ? threadMemoryResourceId(scope.threadId)
        : scope.resourceId;
}
function draftChatMemoryResourceId(userId) {
    return `${DRAFT_CHAT_MEMORY_RESOURCE_PREFIX}${userId}`;
}
function productionChatMemoryResourceId(userId) {
    return `${PRODUCTION_CHAT_MEMORY_RESOURCE_PREFIX}${userId}`;
}
function systemChatMemoryResourceId(userId) {
    return `${SYSTEM_CHAT_MEMORY_RESOURCE_PREFIX}${userId}`;
}
function userIdFromSystemChatMemoryResourceId(resourceId) {
    if (!resourceId.startsWith(SYSTEM_CHAT_MEMORY_RESOURCE_PREFIX))
        return undefined;
    const userId = resourceId.slice(SYSTEM_CHAT_MEMORY_RESOURCE_PREFIX.length);
    return userId.length > 0 ? userId : undefined;
}
function userIdFromProductionChatMemoryResourceId(resourceId) {
    if (!resourceId.startsWith(PRODUCTION_CHAT_MEMORY_RESOURCE_PREFIX))
        return undefined;
    const userId = resourceId.slice(PRODUCTION_CHAT_MEMORY_RESOURCE_PREFIX.length);
    return userId.length > 0 ? userId : undefined;
}
function userIdFromDraftChatMemoryResourceId(resourceId) {
    if (!resourceId.startsWith(DRAFT_CHAT_MEMORY_RESOURCE_PREFIX))
        return undefined;
    const userId = resourceId.slice(DRAFT_CHAT_MEMORY_RESOURCE_PREFIX.length);
    return userId.length > 0 ? userId : undefined;
}
function integrationTypeFromMemoryResourceId(resourceId) {
    if (!resourceId.startsWith(INTEGRATION_MEMORY_RESOURCE_PREFIX))
        return undefined;
    const separator = resourceId.indexOf(':', INTEGRATION_MEMORY_RESOURCE_PREFIX.length);
    if (separator === -1)
        return undefined;
    const integrationType = resourceId.slice(INTEGRATION_MEMORY_RESOURCE_PREFIX.length, separator);
    return integrationType.length > 0 ? integrationType : undefined;
}
function integrationMemoryResourceId(integrationType, platformUserId) {
    return `${INTEGRATION_MEMORY_RESOURCE_PREFIX}${integrationType}:${platformUserId}`;
}
function isIntegrationMemoryResourceId(resourceId) {
    return resourceId?.startsWith(INTEGRATION_MEMORY_RESOURCE_PREFIX) === true;
}
function taskRunMemoryResourceId(taskId) {
    return `task:${taskId}`;
}
function isTaskRunMemoryResourceId(resourceId) {
    return resourceId?.startsWith('task:') === true;
}
//# sourceMappingURL=agent-memory-scope.js.map