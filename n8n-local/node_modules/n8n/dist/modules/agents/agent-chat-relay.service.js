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
exports.AgentChatRelayService = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const sanitize_filename_1 = require("@n8n/utils/files/sanitize-filename");
const n8n_core_1 = require("n8n-core");
const promises_1 = require("node:stream/promises");
const agent_chat_attachment_service_1 = require("./agent-chat-attachment.service");
const agent_message_queue_service_1 = require("./agent-message-queue.service");
const agent_queued_preview_stream_service_1 = require("./agent-queued-preview-stream.service");
const agent_sse_stream_1 = require("./agent-sse-stream");
const inbound_attachments_1 = require("./utils/inbound-attachments");
let AgentChatRelayService = class AgentChatRelayService {
    constructor(messageQueue, queuedPreviewStreams, agentChatAttachmentService) {
        this.messageQueue = messageQueue;
        this.queuedPreviewStreams = queuedPreviewStreams;
        this.agentChatAttachmentService = agentChatAttachmentService;
    }
    createChatExecution(res) {
        const delivery = (0, agent_sse_stream_1.initSseStream)(res);
        const requestController = new AbortController();
        const abandon = () => requestController.abort();
        delivery.abortSignal.addEventListener('abort', abandon, { once: true });
        if (delivery.abortSignal.aborted)
            abandon();
        return {
            send: delivery.send,
            abortSignal: requestController.signal,
            onExecutionStarted: (id, sessionId, inputMessageIds) => {
                delivery.abortSignal.removeEventListener('abort', abandon);
                delivery.send({ type: 'execution-started', executionId: id, sessionId, inputMessageIds });
            },
            onChunk: delivery.onChunk,
            close: () => {
                delivery.abortSignal.removeEventListener('abort', abandon);
                delivery.close();
            },
        };
    }
    async storeChatAttachments(params) {
        const { attachments, agentId, projectId, threadId, resourceId, source = 'chat' } = params;
        if (!attachments?.length)
            return undefined;
        const stored = [];
        try {
            for (const attachment of attachments) {
                const data = Buffer.from(attachment.data, 'base64');
                if (data.byteLength === 0) {
                    throw new errors_1.BadRequestError(`Attachment "${attachment.fileName}" is empty`);
                }
                if (data.byteLength > api_types_1.MAX_AGENT_CHAT_ATTACHMENT_SIZE_BYTES) {
                    throw new errors_1.BadRequestError(`Attachment "${attachment.fileName}" exceeds the ${api_types_1.MAX_AGENT_CHAT_ATTACHMENT_SIZE_MB} MB limit`);
                }
                const mimeType = await (0, inbound_attachments_1.resolveInboundMimeType)(attachment.mimeType, data);
                const row = await this.agentChatAttachmentService.storeInbound({
                    agentId,
                    projectId,
                    threadId,
                    resourceId,
                    source,
                    fileName: attachment.fileName,
                    mimeType,
                    data,
                });
                stored.push({
                    id: row.id,
                    fileName: row.fileName,
                    mimeType: row.mimeType,
                    sizeBytes: row.fileSizeBytes,
                });
            }
        }
        catch (error) {
            await this.agentChatAttachmentService.deleteByIds(stored.map((ref) => ref.id));
            throw error;
        }
        return stored;
    }
    async relayQueuedMessage(res, accept) {
        const delivery = (0, agent_sse_stream_1.initSseStream)(res);
        const { send, abortSignal } = delivery;
        let accepted = false;
        let subscription;
        let attachments;
        try {
            const input = await accept(send, abortSignal);
            if (!input)
                return;
            attachments = input.payload.attachments;
            abortSignal.throwIfAborted();
            const result = await this.messageQueue.enqueue(input, (queueId) => {
                subscription = this.queuedPreviewStreams.subscribe(queueId, delivery);
            });
            if (result.status === 'duplicate') {
                send({ type: 'done' });
                return;
            }
            accepted = true;
            subscription?.accepted();
            send({ type: 'message-queued', queueId: result.item.id, sessionId: input.threadId });
            await subscription?.done;
        }
        catch (error) {
            send((0, agent_sse_stream_1.toChatErrorEvent)(error, 'Chat failed'));
        }
        finally {
            if (!accepted && attachments?.length) {
                await this.agentChatAttachmentService
                    .deleteByIds(attachments.map((ref) => ref.id))
                    .catch(() => { });
            }
            subscription?.close();
            delivery.close();
        }
    }
    async streamAttachment(attachment, res) {
        const attachmentId = attachment.id;
        let stream;
        try {
            stream = await this.agentChatAttachmentService.getStream(attachment);
        }
        catch (error) {
            if (error instanceof n8n_core_1.FileNotFoundError) {
                throw new errors_1.NotFoundError(`Attachment "${attachmentId}" is no longer available`);
            }
            throw error;
        }
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Length', attachment.fileSizeBytes);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', (0, n8n_core_1.getHtmlSandboxCSP)());
        if (!api_types_1.ViewableMimeTypes.includes(attachment.mimeType.toLowerCase())) {
            res.setHeader('Content-Disposition', `attachment; filename="${(0, sanitize_filename_1.sanitizeFilename)(attachment.fileName)}"`);
        }
        try {
            await (0, promises_1.pipeline)(stream, res);
        }
        catch (error) {
            if (error instanceof Error &&
                'code' in error &&
                error.code === 'ERR_STREAM_PREMATURE_CLOSE') {
                return;
            }
            throw error;
        }
    }
};
exports.AgentChatRelayService = AgentChatRelayService;
exports.AgentChatRelayService = AgentChatRelayService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_message_queue_service_1.AgentMessageQueueService, agent_queued_preview_stream_service_1.AgentQueuedPreviewStreamService, agent_chat_attachment_service_1.AgentChatAttachmentService])
], AgentChatRelayService);
//# sourceMappingURL=agent-chat-relay.service.js.map