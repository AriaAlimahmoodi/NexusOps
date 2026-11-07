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
exports.AgentChatAttachmentService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const agent_chat_attachment_repository_1 = require("./repositories/agent-chat-attachment.repository");
const agent_execution_thread_repository_1 = require("./repositories/agent-execution-thread.repository");
const agent_memory_scope_1 = require("./utils/agent-memory-scope");
const agent_thread_access_1 = require("./utils/agent-thread-access");
const ATTACHMENT_SOURCE_TYPE = 'agent_chat_attachment';
const RETENTION_BATCH_SIZE = 500;
function buildAttachmentFileLocation(agentId, attachmentId) {
    return n8n_core_1.FileLocation.ofCustom({
        pathSegments: ['agents', agentId ?? 'inline', 'attachments', attachmentId],
        sourceType: ATTACHMENT_SOURCE_TYPE,
        sourceId: attachmentId,
    });
}
let AgentChatAttachmentService = class AgentChatAttachmentService {
    constructor(logger, binaryDataService, repository, threadRepository) {
        this.logger = logger;
        this.binaryDataService = binaryDataService;
        this.repository = repository;
        this.threadRepository = threadRepository;
    }
    async storeInbound(params) {
        const attachmentId = (0, generate_nano_id_1.generateNanoId)();
        const binaryData = {
            data: '',
            mimeType: params.mimeType,
            fileName: params.fileName,
        };
        const stored = await this.binaryDataService.store(buildAttachmentFileLocation(params.agentId, attachmentId), params.data, binaryData);
        if (!stored.id) {
            throw new n8n_workflow_1.OperationalError('Agent chat attachments require a persisted binary data storage mode');
        }
        try {
            const attachment = this.repository.create({
                id: attachmentId,
                agentId: params.agentId,
                projectId: params.projectId,
                threadId: params.threadId,
                resourceId: params.resourceId ?? null,
                binaryDataId: stored.id,
                fileName: params.fileName,
                mimeType: params.mimeType,
                fileSizeBytes: params.data.byteLength,
                source: params.source,
            });
            return await this.repository.save(attachment);
        }
        catch (error) {
            await this.binaryDataService
                .deleteManyByBinaryDataId([stored.id])
                .catch((cleanupError) => this.logger.warn('Failed to delete agent chat attachment bytes', {
                binaryDataId: stored.id,
                error: cleanupError,
            }));
            throw error;
        }
    }
    async getForAgent(attachmentId, scope) {
        const attachment = await this.repository.findByIdForAgent(attachmentId, scope);
        if (!attachment)
            return null;
        const thread = await this.threadRepository.findOneBy({ id: attachment.threadId });
        if (thread) {
            return (0, agent_thread_access_1.threadBelongsTo)(thread, scope.projectId, scope.agentId, scope.userId)
                ? attachment
                : null;
        }
        return attachment.resourceId === (0, agent_memory_scope_1.draftChatMemoryResourceId)(scope.userId) ||
            (0, agent_memory_scope_1.isIntegrationMemoryResourceId)(attachment.resourceId ?? undefined) ||
            (0, agent_memory_scope_1.isTaskRunMemoryResourceId)(attachment.resourceId ?? undefined)
            ? attachment
            : null;
    }
    async getStream(attachment) {
        return await this.binaryDataService.getAsStream(attachment.binaryDataId);
    }
    async deleteByIds(attachmentIds) {
        if (attachmentIds.length === 0)
            return;
        await this.deleteAttachments(await this.repository.findByIds(attachmentIds), {
            attachmentIds: attachmentIds.join(','),
        });
    }
    async deleteByThread(threadId, scope) {
        await this.deleteAttachments(await this.repository.findByThread(threadId, scope), {
            threadId,
        });
    }
    async deleteByAgent(agentId) {
        await this.deleteAttachments(await this.repository.findBy({ agentId }), { agentId });
    }
    async deleteFromSourceCreatedBefore(scope, before, signal) {
        let deleted = 0;
        while (!signal?.aborted) {
            const batch = await this.repository.findFromSourceCreatedBefore(scope, before, RETENTION_BATCH_SIZE);
            if (batch.length === 0)
                break;
            await this.binaryDataService.deleteManyByBinaryDataId(batch.map((attachment) => attachment.binaryDataId));
            await this.repository.delete(batch.map((attachment) => attachment.id));
            deleted += batch.length;
            if (batch.length < RETENTION_BATCH_SIZE)
                break;
        }
        return deleted;
    }
    async deleteStoredData(binaryDataIds, logContext) {
        if (binaryDataIds.length === 0)
            return;
        await this.binaryDataService.deleteManyByBinaryDataId(binaryDataIds).catch((error) => this.logger.warn('Failed to delete agent chat attachment bytes', {
            ...logContext,
            error,
        }));
    }
    async deleteAttachments(attachments, logContext) {
        if (attachments.length === 0)
            return;
        await this.repository.delete(attachments.map((attachment) => attachment.id));
        await this.deleteStoredData(attachments.map((attachment) => attachment.binaryDataId), logContext);
    }
    getFileStore(scope, provider) {
        return {
            load: async (ref, runScope) => {
                const attachment = runScope?.threadId
                    ? await this.repository.findByIdInThread(ref.id, {
                        projectId: scope.projectId,
                        threadId: runScope.threadId,
                    })
                    : await this.repository.findByIdForAgent(ref.id, scope);
                if (!attachment)
                    return null;
                try {
                    return await this.binaryDataService.getAsBuffer({
                        id: attachment.binaryDataId,
                        data: '',
                        mimeType: attachment.mimeType,
                    });
                }
                catch (error) {
                    if (error instanceof n8n_core_1.FileNotFoundError) {
                        this.logger.debug('Agent chat attachment bytes no longer in storage', {
                            attachmentId: ref.id,
                        });
                    }
                    else {
                        this.logger.warn('Failed to load agent chat attachment bytes', {
                            attachmentId: ref.id,
                            error,
                        });
                    }
                    return null;
                }
            },
            isMediaTypeSupported: (mediaType) => (0, api_types_1.isAttachmentMediaTypeSupported)(provider, mediaType),
        };
    }
};
exports.AgentChatAttachmentService = AgentChatAttachmentService;
exports.AgentChatAttachmentService = AgentChatAttachmentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, n8n_core_1.BinaryDataService, agent_chat_attachment_repository_1.AgentChatAttachmentRepository, agent_execution_thread_repository_1.AgentExecutionThreadRepository])
], AgentChatAttachmentService);
//# sourceMappingURL=agent-chat-attachment.service.js.map