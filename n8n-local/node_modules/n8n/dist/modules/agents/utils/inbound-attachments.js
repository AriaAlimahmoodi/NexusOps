"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInboundMimeType = resolveInboundMimeType;
exports.buildInboundUserMessage = buildInboundUserMessage;
exports.readInboundUserMessage = readInboundUserMessage;
const api_types_1 = require("@n8n/api-types");
const n8n_workflow_1 = require("n8n-workflow");
function modelEligibleFamily(mimeType) {
    const baseType = mimeType.split(';')[0].trim().toLowerCase();
    if (baseType.startsWith('image/'))
        return 'image';
    if (baseType === 'application/pdf')
        return 'pdf';
    if (baseType.startsWith('audio/'))
        return 'audio';
    return null;
}
async function resolveInboundMimeType(declared, data) {
    if (declared && declared.length > api_types_1.MAX_AGENT_CHAT_ATTACHMENT_MIMETYPE_LENGTH) {
        return 'application/octet-stream';
    }
    const declaredFamily = declared ? modelEligibleFamily(declared) : null;
    if (declared && !declaredFamily)
        return declared;
    const { fileTypeFromBuffer } = await import('file-type');
    const sniffed = await fileTypeFromBuffer(data);
    if (!declared)
        return sniffed?.mime ?? 'application/octet-stream';
    if (!sniffed || modelEligibleFamily(sniffed.mime) !== declaredFamily) {
        return 'application/octet-stream';
    }
    return sniffed.mime;
}
function buildInboundUserMessage(text, attachments) {
    const content = [];
    if (text) {
        content.push({ type: 'text', text });
    }
    for (const attachment of attachments) {
        content.push({
            type: 'file',
            mediaType: attachment.mimeType,
            fileRef: {
                id: attachment.id,
                fileName: attachment.fileName,
                sizeBytes: attachment.sizeBytes,
            },
        });
    }
    return [{ role: 'user', content }];
}
function readInboundUserMessage(input) {
    if (!('role' in input) || input.role !== 'user') {
        throw new n8n_workflow_1.UnexpectedError('Queued input must be a user message');
    }
    return {
        message: input.content
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('\n'),
        attachments: input.content.flatMap((part) => {
            if (part.type !== 'file' || !part.fileRef)
                return [];
            return [
                {
                    id: part.fileRef.id,
                    fileName: part.fileRef.fileName ?? '',
                    mimeType: part.mediaType ?? 'application/octet-stream',
                    sizeBytes: part.fileRef.sizeBytes ?? 0,
                },
            ];
        }),
    };
}
//# sourceMappingURL=inbound-attachments.js.map