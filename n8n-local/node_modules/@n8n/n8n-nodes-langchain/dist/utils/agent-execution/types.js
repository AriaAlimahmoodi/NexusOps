"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isThinkingBlock = isThinkingBlock;
exports.isRedactedThinkingBlock = isRedactedThinkingBlock;
exports.isGeminiThoughtSignatureBlock = isGeminiThoughtSignatureBlock;
function isThinkingBlock(block) {
    return (typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'thinking' &&
        'thinking' in block &&
        typeof block.thinking === 'string' &&
        'signature' in block &&
        typeof block.signature === 'string');
}
function isRedactedThinkingBlock(block) {
    return (typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'redacted_thinking' &&
        'data' in block &&
        typeof block.data === 'string');
}
function isGeminiThoughtSignatureBlock(block) {
    return (typeof block === 'object' &&
        block !== null &&
        'thoughtSignature' in block &&
        typeof block.thoughtSignature === 'string');
}
//# sourceMappingURL=types.js.map