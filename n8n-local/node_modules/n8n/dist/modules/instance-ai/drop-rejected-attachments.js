"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTACHMENT_REMOVED_NOTE = void 0;
exports.stripFileAttachmentParts = stripFileAttachmentParts;
exports.dropRejectedAttachmentsFromHistory = dropRejectedAttachmentsFromHistory;
exports.ATTACHMENT_REMOVED_NOTE = '[An attached file was removed because it was too large to process.]';
function hasContentArray(message) {
    return 'content' in message && Array.isArray(message.content);
}
function stripFileAttachmentParts(messages) {
    const changed = [];
    for (const message of messages) {
        if (!hasContentArray(message))
            continue;
        const withoutFiles = message.content.filter((part) => part.type !== 'file');
        if (withoutFiles.length === message.content.length)
            continue;
        changed.push({
            ...message,
            content: [...withoutFiles, { type: 'text', text: exports.ATTACHMENT_REMOVED_NOTE }],
        });
    }
    return changed;
}
async function dropRejectedAttachmentsFromHistory(memory, args, logger) {
    try {
        const sanitized = stripFileAttachmentParts(await memory.getMessages(args.threadId));
        if (sanitized.length === 0)
            return 'no-attachments';
        await memory.saveMessages({
            threadId: args.threadId,
            resourceId: args.resourceId,
            messages: sanitized,
        });
        logger.info('Dropped rejected attachments from Instance AI thread history', {
            threadId: args.threadId,
            messageCount: sanitized.length,
        });
        return 'removed';
    }
    catch (error) {
        logger.warn('Failed to drop rejected attachments from Instance AI thread history', {
            threadId: args.threadId,
            error: error instanceof Error ? error.message : String(error),
        });
        return 'failed';
    }
}
//# sourceMappingURL=drop-rejected-attachments.js.map