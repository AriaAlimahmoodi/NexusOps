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
exports.AgentExecutionUpdateBroadcaster = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const push_1 = require("../../push");
const publisher_service_1 = require("../../scaling/pubsub/publisher.service");
const agent_push_recipients_service_1 = require("./agent-push-recipients.service");
const agent_execution_thread_repository_1 = require("./repositories/agent-execution-thread.repository");
const agent_thread_access_1 = require("./utils/agent-thread-access");
let AgentExecutionUpdateBroadcaster = class AgentExecutionUpdateBroadcaster {
    constructor(logger, recipients, push, publisher, instanceSettings, threadRepository) {
        this.logger = logger;
        this.recipients = recipients;
        this.push = push;
        this.publisher = publisher;
        this.instanceSettings = instanceSettings;
        this.threadRepository = threadRepository;
        this.logger = this.logger.scoped('agents');
    }
    notify(data) {
        void this.broadcast(data).catch((error) => {
            this.logger.warn('Failed to broadcast agent execution update', {
                executionId: data.executionId,
                threadId: data.threadId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }
    async broadcast(data) {
        const thread = await this.threadRepository.findOneBy({ id: data.threadId });
        if (!thread || thread.projectId !== data.projectId || thread.agentId !== data.agentId)
            return;
        const userIds = await this.getRecipients(thread);
        if (userIds.length === 0)
            return;
        this.push.sendToUsers({ type: 'agentExecutionUpdated', data }, userIds);
        if (this.instanceSettings.isWorker || this.instanceSettings.isMultiMain) {
            await this.publisher.publishCommand({
                command: 'relay-agent-execution-update',
                payload: { data, userIds },
            });
        }
    }
    notifyBackgroundJobsUpdated(agentId, threadId) {
        void this.broadcastBackgroundJobsUpdated(agentId, threadId).catch((error) => {
            this.logger.warn('Failed to broadcast background job update', { agentId, threadId, error });
        });
    }
    async broadcastBackgroundJobsUpdated(agentId, threadId) {
        const thread = await this.threadRepository.findOneBy({ id: threadId });
        if (!thread || thread.agentId !== agentId)
            return;
        const data = { projectId: thread.projectId, agentId, threadId };
        const userIds = await this.getRecipients(thread);
        if (userIds.length === 0)
            return;
        this.push.sendToUsers({ type: 'agentBackgroundTasksUpdated', data }, userIds);
        if (this.instanceSettings.isWorker || this.instanceSettings.isMultiMain) {
            await this.publisher.publishCommand({
                command: 'relay-agent-background-tasks-update',
                payload: { data, userIds },
            });
        }
    }
    notifyQueueUpdated(threadId) {
        void this.broadcastQueueUpdated(threadId).catch((error) => {
            this.logger.warn('Failed to broadcast agent queue update', { threadId, error });
        });
    }
    async broadcastQueueUpdated(threadId) {
        const thread = await this.threadRepository.findOneBy({ id: threadId });
        if (!thread || thread.accessScope !== 'user' || !thread.ownerId)
            return;
        const data = { projectId: thread.projectId, agentId: thread.agentId, threadId };
        const userIds = await this.getRecipients(thread);
        if (userIds.length === 0)
            return;
        this.push.sendToUsers({ type: 'agentMessageQueueUpdated', data }, userIds);
        if (this.instanceSettings.isWorker || this.instanceSettings.isMultiMain) {
            await this.publisher.publishCommand({
                command: 'relay-agent-message-queue-update',
                payload: { data, userIds },
            });
        }
    }
    handleQueueRelay({ data, userIds }) {
        this.push.sendToUsers({ type: 'agentMessageQueueUpdated', data }, userIds);
    }
    async getRecipients(thread) {
        const scope = thread.accessScope === 'user' ? 'agent:execute' : 'agent:read';
        const userIds = await this.recipients.getProjectUsersWithScope(thread.projectId, scope);
        return userIds.filter((id) => (0, agent_thread_access_1.threadBelongsTo)(thread, thread.projectId, thread.agentId, id));
    }
    handleBackgroundJobsRelay({ data, userIds, }) {
        this.push.sendToUsers({ type: 'agentBackgroundTasksUpdated', data }, userIds);
    }
    handleRelay({ data, userIds }) {
        this.push.sendToUsers({ type: 'agentExecutionUpdated', data }, userIds);
    }
};
exports.AgentExecutionUpdateBroadcaster = AgentExecutionUpdateBroadcaster;
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-agent-message-queue-update', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentExecutionUpdateBroadcaster.prototype, "handleQueueRelay", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-agent-background-tasks-update', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentExecutionUpdateBroadcaster.prototype, "handleBackgroundJobsRelay", null);
__decorate([
    (0, decorators_1.OnPubSubEvent)('relay-agent-execution-update', { instanceType: 'main' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentExecutionUpdateBroadcaster.prototype, "handleRelay", null);
exports.AgentExecutionUpdateBroadcaster = AgentExecutionUpdateBroadcaster = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, agent_push_recipients_service_1.AgentPushRecipientsService, push_1.Push, publisher_service_1.Publisher, n8n_core_1.InstanceSettings, agent_execution_thread_repository_1.AgentExecutionThreadRepository])
], AgentExecutionUpdateBroadcaster);
//# sourceMappingURL=agent-execution-update-broadcaster.js.map