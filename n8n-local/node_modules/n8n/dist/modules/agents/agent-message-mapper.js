"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentPartToDto = contentPartToDto;
exports.messageToDto = messageToDto;
exports.messagesToDto = messagesToDto;
const agents_1 = require("@n8n/agents");
function contentPartToDto(part) {
    const dto = { type: part.type };
    if ('text' in part && typeof part.text === 'string')
        dto.text = part.text;
    if ('toolName' in part && typeof part.toolName === 'string')
        dto.toolName = part.toolName;
    if ('toolCallId' in part && typeof part.toolCallId === 'string') {
        dto.toolCallId = part.toolCallId;
    }
    if ('input' in part)
        dto.input = part.input;
    if ('state' in part && typeof part.state === 'string')
        dto.state = part.state;
    if ('output' in part)
        dto.output = part.output;
    if ('error' in part && typeof part.error === 'string')
        dto.error = part.error;
    if (part.type === 'file' && part.fileRef) {
        dto.fileId = part.fileRef.id;
        if (part.fileRef.fileName !== undefined)
            dto.fileName = part.fileRef.fileName;
        if (part.mediaType !== undefined)
            dto.mimeType = part.mediaType;
        if (part.fileRef.sizeBytes !== undefined)
            dto.sizeBytes = part.fileRef.sizeBytes;
    }
    return dto;
}
function messageToDto(msg) {
    if (!('role' in msg) || !Array.isArray(msg.content))
        return null;
    const createdAt = (0, agents_1.getCreatedAt)(msg);
    return {
        id: msg.id,
        role: msg.role,
        content: msg.content.map(contentPartToDto),
        ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
    };
}
function messagesToDto(msgs) {
    const out = [];
    for (const m of msgs) {
        const dto = messageToDto(m);
        if (dto)
            out.push(dto);
    }
    return out;
}
//# sourceMappingURL=agent-message-mapper.js.map