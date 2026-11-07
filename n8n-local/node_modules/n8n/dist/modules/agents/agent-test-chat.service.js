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
exports.AgentTestChatService = void 0;
exports.chatThreadId = chatThreadId;
const di_1 = require("@n8n/di");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const background_job_messages_1 = require("./background/background-job-messages");
const builder_tool_names_1 = require("./builder/builder-tool-names");
const n8n_memory_1 = require("./integrations/n8n-memory");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
function chatThreadId(agentId, userId) {
    const baseThreadId = `${builder_tool_names_1.AGENT_THREAD_PREFIX.TEST}${agentId}`;
    return userId ? `${baseThreadId}:${userId}` : baseThreadId;
}
let AgentTestChatService = class AgentTestChatService {
    constructor(n8nMemory, agentChatAttachmentService) {
        this.n8nMemory = n8nMemory;
        this.agentChatAttachmentService = agentChatAttachmentService;
    }
    async getTestChatMessages(agentId, userId) {
        const messages = await this.n8nMemory
            .getImplementation(agentId)
            .getMessages(chatThreadId(agentId, userId), {
            resourceId: (0, agent_memory_scope_1.draftChatMemoryResourceId)(userId),
        });
        return messages.filter((message) => !('role' in message) ||
            message.role !== 'user' ||
            !Array.isArray(message.content) ||
            !message.content.some((part) => part.type === 'text' &&
                typeof part.text === 'string' &&
                part.text.startsWith(background_job_messages_1.AGENT_BACKGROUND_WAKE_OPEN_TAG)));
    }
    async clearTestChatMessages(agentId, userId) {
        const threadId = chatThreadId(agentId, userId);
        await this.n8nMemory.getImplementation(agentId).deleteThread(threadId);
        await this.agentChatAttachmentService.deleteByThread(threadId, { agentId });
    }
    async clearAllTestChatMessages(agentId) {
        const threadId = chatThreadId(agentId);
        const memory = this.n8nMemory.getImplementation(agentId);
        await memory.deleteThreadsByPrefix(threadId);
    }
};
exports.AgentTestChatService = AgentTestChatService;
exports.AgentTestChatService = AgentTestChatService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_memory_1.N8nMemory, agent_chat_attachment_service_1.AgentChatAttachmentService])
], AgentTestChatService);
//# sourceMappingURL=agent-test-chat.service.js.map