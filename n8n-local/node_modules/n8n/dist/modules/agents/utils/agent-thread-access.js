"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_CHAT_SOURCE = exports.N8N_CHAT_PRODUCTION_SOURCE = exports.PREVIEW_THREAD_SOURCES = void 0;
exports.chatSurfaceMemoryResourceId = chatSurfaceMemoryResourceId;
exports.threadBelongsTo = threadBelongsTo;
exports.canContinueThreadInPreview = canContinueThreadInPreview;
exports.canContinueThreadInN8nChat = canContinueThreadInN8nChat;
exports.canContinueSystemThread = canContinueSystemThread;
exports.canUseTopLevelDraftThread = canUseTopLevelDraftThread;
const agent_memory_scope_1 = require("./agent-memory-scope");
exports.PREVIEW_THREAD_SOURCES = ['', 'chat', 'n8n_chat'];
exports.N8N_CHAT_PRODUCTION_SOURCE = 'n8n_chat_production';
exports.SYSTEM_CHAT_SOURCE = 'system_chat';
function chatSurfaceMemoryResourceId(surface, userId) {
    switch (surface) {
        case 'n8n-chat':
            return (0, agent_memory_scope_1.productionChatMemoryResourceId)(userId);
        case 'system':
            return (0, agent_memory_scope_1.systemChatMemoryResourceId)(userId);
        case 'preview':
            return (0, agent_memory_scope_1.draftChatMemoryResourceId)(userId);
    }
}
function threadBelongsTo(thread, projectId, agentId, userId) {
    return (thread.projectId === projectId &&
        thread.agentId === agentId &&
        (thread.accessScope === 'project' ||
            (thread.accessScope === 'user' && thread.ownerId !== null && thread.ownerId === userId)));
}
function canContinueThreadInPreview(thread, userId, source) {
    return (canUseTopLevelDraftThread(thread, userId) &&
        thread.taskId === null &&
        exports.PREVIEW_THREAD_SOURCES.some((previewSource) => previewSource === (source?.trim().toLowerCase() ?? '')));
}
function canContinueThreadInN8nChat(thread, userId, source) {
    return (canUseTopLevelDraftThread(thread, userId) &&
        thread.taskId === null &&
        source === exports.N8N_CHAT_PRODUCTION_SOURCE);
}
function canContinueSystemThread(thread, userId, source) {
    return (canUseTopLevelDraftThread(thread, userId) &&
        thread.taskId === null &&
        source === exports.SYSTEM_CHAT_SOURCE);
}
function canUseTopLevelDraftThread(thread, userId) {
    return (thread.accessScope === 'user' && thread.ownerId === userId && thread.parentThreadId === null);
}
//# sourceMappingURL=agent-thread-access.js.map