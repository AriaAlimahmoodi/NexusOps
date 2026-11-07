"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextContent = extractTextContent;
exports.extractThinkingContent = extractThinkingContent;
exports.pushValidationFeedback = pushValidationFeedback;
const messages_1 = require("@langchain/core/messages");
function isTextContentBlock(block) {
    return (typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'text' &&
        'text' in block);
}
function isThinkingContentBlock(block) {
    return (typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'thinking' &&
        'thinking' in block);
}
function extractTextContent(message) {
    if (typeof message.content === 'string') {
        return message.content || null;
    }
    if (Array.isArray(message.content)) {
        const textParts = message.content.filter(isTextContentBlock).map((block) => block.text);
        return textParts.length > 0 ? textParts.join('\n') : null;
    }
    return null;
}
function extractThinkingContent(message) {
    const textContent = extractTextContent(message);
    if (!textContent) {
        if (Array.isArray(message.content)) {
            const thinkingBlocks = message.content
                .filter(isThinkingContentBlock)
                .map((block) => block.thinking);
            if (thinkingBlocks.length > 0) {
                return thinkingBlocks.join('\n\n');
            }
        }
        return null;
    }
    const thinkingMatches = textContent.match(/<thinking>([\s\S]*?)<\/thinking>/g);
    if (thinkingMatches) {
        return thinkingMatches.map((match) => match.replace(/<\/?thinking>/g, '').trim()).join('\n\n');
    }
    if (Array.isArray(message.content)) {
        const thinkingBlocks = message.content
            .filter(isThinkingContentBlock)
            .map((block) => block.thinking);
        if (thinkingBlocks.length > 0) {
            return thinkingBlocks.join('\n\n');
        }
    }
    return null;
}
function pushValidationFeedback(messages, content) {
    const toolCallId = `auto-validate-${Date.now()}`;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage instanceof messages_1.AIMessage) {
        const existingBlocks = typeof lastMessage.content === 'string'
            ? lastMessage.content
                ? [{ type: 'text', text: lastMessage.content }]
                : []
            : Array.isArray(lastMessage.content)
                ? [...lastMessage.content]
                : [];
        const newAiMessage = new messages_1.AIMessage({
            content: [
                ...existingBlocks,
                { type: 'tool_use', id: toolCallId, name: 'validate_workflow', input: {} },
            ],
            tool_calls: [
                ...(lastMessage.tool_calls ?? []),
                { id: toolCallId, name: 'validate_workflow', args: {} },
            ],
            response_metadata: lastMessage.response_metadata,
            id: lastMessage.id,
        });
        messages[messages.length - 1] = newAiMessage;
    }
    messages.push(new messages_1.ToolMessage({
        tool_call_id: toolCallId,
        content,
    }));
}
//# sourceMappingURL=content-extractors.js.map