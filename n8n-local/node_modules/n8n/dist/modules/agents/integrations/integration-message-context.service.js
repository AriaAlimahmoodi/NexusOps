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
exports.IntegrationMessageContextService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const integration_message_context_1 = require("./integration-message-context");
const agent_resource_repository_1 = require("../repositories/agent-resource.repository");
const agent_thread_repository_1 = require("../repositories/agent-thread.repository");
const MESSAGE_CONTEXT_METADATA_KEY = 'currentMessageContext';
const CONTINUE_AS_METADATA_KEY = 'continueAs';
const BOUND_THREADS_METADATA_KEY = 'boundThreads';
let IntegrationMessageContextService = class IntegrationMessageContextService {
    constructor(threadRepository, resourceRepository, logger) {
        this.threadRepository = threadRepository;
        this.resourceRepository = resourceRepository;
        this.logger = logger;
    }
    async getLatest(threadId) {
        const thread = await this.threadRepository.findOneBy({ id: threadId });
        const value = this.parseMetadata(thread?.metadata)[MESSAGE_CONTEXT_METADATA_KEY];
        return (0, integration_message_context_1.isIntegrationMessageContext)(value) ? value : null;
    }
    async getForResume(persistence) {
        const context = (0, integration_message_context_1.readIntegrationMessageContext)(persistence);
        return context === undefined ? await this.getLatest(persistence.threadId) : context;
    }
    async getLatestForIncoming(threadId) {
        try {
            return await this.getLatest(threadId);
        }
        catch (error) {
            this.logger.warn('Failed to read previous integration message context', {
                threadId,
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    async installIncoming(context, memory, conversation) {
        const scopes = conversation.threadId === memory.threadId ? [conversation] : [conversation, memory];
        for (const { threadId, resourceId } of scopes) {
            try {
                await this.setLatest(threadId, resourceId, context);
            }
            catch (error) {
                this.logger.warn('Failed to update integration message context', {
                    threadId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    }
    async setLatest(threadId, resourceId, context) {
        await this.writeMetadata(threadId, resourceId, {
            [MESSAGE_CONTEXT_METADATA_KEY]: context,
        });
    }
    async bindSession(derivedThreadId, origin) {
        if (derivedThreadId === origin.threadId)
            return;
        if (await this.resolveSession(derivedThreadId))
            return;
        await this.appendBoundThread(origin.threadId, derivedThreadId);
        await this.writeContinueAsIfAbsent(derivedThreadId, origin);
    }
    async resolveSession(derivedThreadId) {
        const thread = await this.threadRepository.findOneBy({ id: derivedThreadId });
        const value = this.parseMetadata(thread?.metadata)[CONTINUE_AS_METADATA_KEY];
        return isSessionBinding(value) ? value : null;
    }
    async unbindSession(derivedThreadId) {
        await this.writeMetadata(derivedThreadId, undefined, {
            [CONTINUE_AS_METADATA_KEY]: undefined,
        });
    }
    async clearSessionBindings(originThreadId) {
        const existing = await this.threadRepository.findOneBy({ id: originThreadId });
        const metadata = this.parseMetadata(existing?.metadata);
        const bound = Array.isArray(metadata[BOUND_THREADS_METADATA_KEY])
            ? metadata[BOUND_THREADS_METADATA_KEY]
            : [];
        if (bound.length === 0)
            return;
        for (const id of bound)
            await this.unbindSession(id);
        metadata[BOUND_THREADS_METADATA_KEY] = [];
        if (existing) {
            existing.metadata = JSON.stringify(metadata);
            await this.threadRepository.save(existing);
        }
    }
    async writeContinueAsIfAbsent(derivedThreadId, origin) {
        const existing = await this.threadRepository.findOneBy({ id: derivedThreadId });
        const metadata = this.parseMetadata(existing?.metadata);
        if (isSessionBinding(metadata[CONTINUE_AS_METADATA_KEY]))
            return;
        metadata[CONTINUE_AS_METADATA_KEY] = origin;
        if (existing) {
            existing.metadata = JSON.stringify(metadata);
            await this.threadRepository.save(existing);
            return;
        }
        await this.resourceRepository.ensureExists(origin.resourceId);
        await this.threadRepository.save(this.threadRepository.create({
            id: derivedThreadId,
            resourceId: origin.resourceId,
            title: null,
            metadata: JSON.stringify(metadata),
        }));
    }
    async appendBoundThread(originThreadId, derivedThreadId) {
        const existing = await this.threadRepository.findOneBy({ id: originThreadId });
        const metadata = this.parseMetadata(existing?.metadata);
        const bound = Array.isArray(metadata[BOUND_THREADS_METADATA_KEY])
            ? metadata[BOUND_THREADS_METADATA_KEY].filter((id) => id !== derivedThreadId)
            : [];
        bound.push(derivedThreadId);
        metadata[BOUND_THREADS_METADATA_KEY] = bound;
        if (existing) {
            existing.metadata = JSON.stringify(metadata);
            await this.threadRepository.save(existing);
            return;
        }
        await this.resourceRepository.ensureExists(originThreadId);
        await this.threadRepository.save(this.threadRepository.create({
            id: originThreadId,
            resourceId: originThreadId,
            title: null,
            metadata: JSON.stringify(metadata),
        }));
    }
    async writeMetadata(threadId, resourceId, patch) {
        const existing = await this.threadRepository.findOneBy({ id: threadId });
        const metadata = {
            ...this.parseMetadata(existing?.metadata),
            ...patch,
        };
        if (existing) {
            existing.metadata = JSON.stringify(metadata);
            await this.threadRepository.save(existing);
            return;
        }
        await this.resourceRepository.ensureExists(resourceId ?? threadId);
        await this.threadRepository.save(this.threadRepository.create({
            id: threadId,
            resourceId: resourceId ?? threadId,
            title: null,
            metadata: JSON.stringify(metadata),
        }));
    }
    parseMetadata(value) {
        if (!value)
            return {};
        try {
            const parsed = (0, n8n_workflow_1.jsonParse)(value);
            return (0, is_record_1.isRecord)(parsed) ? parsed : {};
        }
        catch {
            return {};
        }
    }
};
exports.IntegrationMessageContextService = IntegrationMessageContextService;
exports.IntegrationMessageContextService = IntegrationMessageContextService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_thread_repository_1.AgentThreadRepository, agent_resource_repository_1.AgentResourceRepository, backend_common_1.Logger])
], IntegrationMessageContextService);
function isSessionBinding(value) {
    return ((0, is_record_1.isRecord)(value) && typeof value.threadId === 'string' && typeof value.resourceId === 'string');
}
//# sourceMappingURL=integration-message-context.service.js.map