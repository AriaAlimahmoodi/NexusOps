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
exports.AgentsSettingsService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_execution_update_broadcaster_1 = require("./agent-execution-update-broadcaster");
const agent_execution_thread_repository_1 = require("./repositories/agent-execution-thread.repository");
const agent_message_queue_repository_1 = require("./repositories/agent-message-queue.repository");
const agent_message_repository_1 = require("./repositories/agent-message.repository");
const inbound_attachments_1 = require("./utils/inbound-attachments");
const AGENTS_ENABLED_KEY = 'agents.enabled';
let AgentsSettingsService = class AgentsSettingsService {
    constructor(settingsRepository, txRunner, queue, threads, messages, attachments, updates, logger) {
        this.settingsRepository = settingsRepository;
        this.txRunner = txRunner;
        this.queue = queue;
        this.threads = threads;
        this.messages = messages;
        this.attachments = attachments;
        this.updates = updates;
        this.logger = logger;
    }
    async getEnabled(ctx = {}) {
        const setting = ctx.trx
            ? await this.settingsRepository.getOrCreateWithReadLock(AGENTS_ENABLED_KEY, 'true', true, ctx)
            : await this.settingsRepository.findByKeyInContext(AGENTS_ENABLED_KEY, ctx);
        if (setting)
            return setting.value === 'true';
        return true;
    }
    async setEnabled(enabled) {
        const removed = await this.txRunner.run({}, async (ctx) => {
            await this.settingsRepository.upsertByKey(AGENTS_ENABLED_KEY, String(enabled), true, ctx);
            return enabled ? [] : await this.cancelPendingMessages(ctx);
        });
        for (const threadId of new Set(removed.map((item) => item.threadId))) {
            this.updates.notifyQueueUpdated(threadId);
        }
        try {
            await this.attachments.deleteByIds(removed.flatMap((item) => (0, inbound_attachments_1.readInboundUserMessage)(item.message.content).attachments.map(({ id }) => id)));
        }
        catch (error) {
            this.logger.warn('Failed to delete attachments from canceled pending Agent messages', {
                error,
            });
        }
    }
    async cancelPendingMessages(ctx) {
        const removed = [];
        for (const threadId of await this.queue.findThreadIds(ctx)) {
            if (!(await this.threads.lockById(threadId, ctx)))
                continue;
            for (const item of await this.queue.listPending(threadId, ctx)) {
                if (item.steeringExecutionId !== null)
                    continue;
                if (!(await this.queue.removePending(threadId, item.id, ctx)))
                    continue;
                await this.messages.clearPendingInput(item.messageId, ctx);
                removed.push(item);
            }
        }
        return removed;
    }
    async assertEnabled(ctx = {}) {
        if (!(await this.getEnabled(ctx))) {
            throw new errors_1.ForbiddenError('Agents are disabled. Ask an instance admin to enable them in Settings > Agents.');
        }
    }
};
exports.AgentsSettingsService = AgentsSettingsService;
exports.AgentsSettingsService = AgentsSettingsService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, db_1.TransactionRunner, agent_message_queue_repository_1.AgentMessageQueueRepository, agent_execution_thread_repository_1.AgentExecutionThreadRepository, agent_message_repository_1.AgentMessageRepository, agent_chat_attachment_service_1.AgentChatAttachmentService, agent_execution_update_broadcaster_1.AgentExecutionUpdateBroadcaster, backend_common_1.Logger])
], AgentsSettingsService);
//# sourceMappingURL=agents-settings.service.js.map