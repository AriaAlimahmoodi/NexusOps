"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLangchainMessagesArray = isLangchainMessagesArray;
function isLangchainMessage(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    if (!('content' in value)) {
        return false;
    }
    const content = value.content;
    if (typeof content !== 'string' && !Array.isArray(content)) {
        return false;
    }
    const hasValidType = '_getType' in value ||
        ('constructor' in value &&
            value.constructor !== null &&
            typeof value.constructor === 'function' &&
            'name' in value.constructor &&
            (value.constructor.name === 'AIMessage' ||
                value.constructor.name === 'HumanMessage' ||
                value.constructor.name === 'ToolMessage')) ||
        ('role' in value &&
            typeof value.role === 'string' &&
            ['assistant', 'human', 'user', 'tool'].includes(value.role));
    return hasValidType;
}
function isLangchainMessagesArray(value) {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every(isLangchainMessage);
}
//# sourceMappingURL=sessions.js.map