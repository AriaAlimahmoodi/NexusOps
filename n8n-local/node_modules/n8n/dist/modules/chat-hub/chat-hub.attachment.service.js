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
exports.ChatHubAttachmentService = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const sanitize_filename_1 = require("@n8n/utils/files/sanitize-filename");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const chat_message_repository_1 = require("./chat-message.repository");
let ChatHubAttachmentService = class ChatHubAttachmentService {
    constructor(binaryDataService, messageRepository) {
        this.binaryDataService = binaryDataService;
        this.messageRepository = messageRepository;
        this.maxTotalSizeBytes = 200 * 1024 * 1024;
    }
    validateAttachments(attachments, allowFileUploads, allowedFilesMimeTypes) {
        if (attachments.length === 0)
            return;
        if (!allowFileUploads) {
            throw new errors_1.BadRequestError('File uploads are not allowed for this model');
        }
        if (allowedFilesMimeTypes === '')
            return;
        for (const attachment of attachments) {
            if (!this.isAllowedMimeType(attachment.mimeType, allowedFilesMimeTypes)) {
                throw new errors_1.BadRequestError(`File type "${attachment.mimeType}" is not allowed. Allowed types: ${allowedFilesMimeTypes}`);
            }
        }
    }
    async store(sessionId, messageId, attachments) {
        let totalSize = 0;
        const storedAttachments = [];
        for (const attachment of attachments) {
            const buffer = Buffer.from(attachment.data, n8n_workflow_1.BINARY_ENCODING);
            totalSize += buffer.length;
            if (totalSize > this.maxTotalSizeBytes) {
                const maxSizeMB = Math.floor(this.maxTotalSizeBytes / (1024 * 1024));
                throw new errors_1.BadRequestError(`Total size of attachments exceeds maximum size of ${maxSizeMB} MB`);
            }
            const stored = await this.processAttachment(sessionId, messageId, attachment, buffer);
            storedAttachments.push(stored);
        }
        return storedAttachments;
    }
    async getAttachment(sessionId, messageId, attachmentIndex) {
        const message = await this.messageRepository.getOneById(messageId, sessionId, []);
        if (!message) {
            throw new errors_1.NotFoundError('Message not found');
        }
        const attachment = message.attachments?.[attachmentIndex];
        if (!attachment) {
            throw new errors_1.NotFoundError('Attachment not found');
        }
        if (attachment.id) {
            const metadata = await this.binaryDataService.getMetadata(attachment.id);
            const stream = await this.binaryDataService.getAsStream(attachment.id);
            return [attachment, { type: 'stream', stream, fileSize: metadata.fileSize }];
        }
        if (attachment.data) {
            const buffer = await this.binaryDataService.getAsBuffer(attachment);
            return [attachment, { type: 'buffer', buffer, fileSize: buffer.length }];
        }
        throw new errors_1.NotFoundError('Attachment has no stored file');
    }
    async deleteAllBySessionId(sessionId, trx) {
        const messages = await this.messageRepository.getManyBySessionId(sessionId, trx);
        await this.deleteAttachments(messages.flatMap((message) => message.attachments ?? []));
    }
    async deleteAll() {
        const messages = await this.messageRepository.find({
            where: {
                attachments: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
            },
            select: ['attachments'],
        });
        await this.deleteAttachments(messages.flatMap((message) => message.attachments ?? []));
    }
    async deleteAttachments(attachments) {
        await this.binaryDataService.deleteManyByBinaryDataId(attachments.flatMap((attachment) => (attachment.id ? [attachment.id] : [])));
    }
    async getDataUrl(binaryData) {
        if (binaryData.data.startsWith('data:')) {
            return binaryData.data;
        }
        const buffer = await this.binaryDataService.getAsBuffer(binaryData);
        const base64Data = buffer.toString(n8n_workflow_1.BINARY_ENCODING);
        const mimeType = binaryData.mimeType || 'application/octet-stream';
        return `data:${mimeType};base64,${base64Data}`;
    }
    async getAsBuffer(binaryData) {
        return await this.binaryDataService.getAsBuffer(binaryData);
    }
    async storeTemporaryExecutionFile(workflowId, buffer, mimeType, fileName) {
        const sanitizedFileName = (0, sanitize_filename_1.sanitizeFilename)(fileName);
        const binaryData = {
            data: buffer.toString(n8n_workflow_1.BINARY_ENCODING),
            mimeType,
            fileName: sanitizedFileName,
            fileSize: `${buffer.length}`,
            fileExtension: sanitizedFileName?.split('.').pop(),
        };
        return await this.binaryDataService.store(n8n_core_1.FileLocation.ofExecution(workflowId, n8n_core_1.TEMP_EXECUTION_ID), buffer, binaryData);
    }
    isAllowedMimeType(mimeType, allowedMimeTypes) {
        const patterns = allowedMimeTypes.split(',').map((p) => p.trim());
        for (const pattern of patterns) {
            if (pattern === '*' || pattern === '*/*')
                return true;
            if (pattern === mimeType)
                return true;
            if (pattern.endsWith('/*')) {
                const category = pattern.slice(0, pattern.indexOf('/'));
                if (mimeType.startsWith(`${category}/`))
                    return true;
            }
        }
        return false;
    }
    async processAttachment(sessionId, messageId, attachment, buffer) {
        const sanitizedFileName = (0, sanitize_filename_1.sanitizeFilename)(attachment.fileName);
        const binaryData = {
            data: attachment.data,
            mimeType: attachment.mimeType,
            fileName: sanitizedFileName,
            fileSize: `${buffer.length}`,
            fileExtension: sanitizedFileName?.split('.').pop(),
        };
        return await this.binaryDataService.store(n8n_core_1.FileLocation.ofCustom({
            sourceType: 'chat_message_attachment',
            pathSegments: ['chat-hub', 'sessions', sessionId, 'messages', messageId],
            sourceId: messageId,
        }), buffer, binaryData);
    }
};
exports.ChatHubAttachmentService = ChatHubAttachmentService;
exports.ChatHubAttachmentService = ChatHubAttachmentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.BinaryDataService, chat_message_repository_1.ChatHubMessageRepository])
], ChatHubAttachmentService);
//# sourceMappingURL=chat-hub.attachment.service.js.map