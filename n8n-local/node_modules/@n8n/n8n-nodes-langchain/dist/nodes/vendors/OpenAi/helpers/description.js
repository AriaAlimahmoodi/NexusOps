"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureNodeInputs = exports.prettifyOperation = void 0;
const prettifyOperation = (resource, operation) => {
    if (operation === 'deleteAssistant') {
        return 'Delete Assistant';
    }
    if (operation === 'deleteFile') {
        return 'Delete File';
    }
    if (operation === 'classify') {
        return 'Classify Text';
    }
    if (operation === 'message' && resource === 'text') {
        return 'Message Model';
    }
    const capitalize = (str) => {
        const chars = str.split('');
        chars[0] = chars[0].toUpperCase();
        return chars.join('');
    };
    if (['transcribe', 'translate'].includes(operation)) {
        resource = 'recording';
    }
    if (operation === 'list') {
        resource = resource + 's';
    }
    return `${capitalize(operation)} ${capitalize(resource)}`;
};
exports.prettifyOperation = prettifyOperation;
const configureNodeInputs = (resource, operation, hideTools, memory) => {
    if (resource === 'assistant' && operation === 'message') {
        const inputs = [
            { type: 'main' },
            { type: 'ai_tool', displayName: 'Tools' },
        ];
        if (memory !== 'threadId') {
            inputs.push({ type: 'ai_memory', displayName: 'Memory', maxConnections: 1 });
        }
        return inputs;
    }
    if (resource === 'text' && (operation === 'message' || operation === 'response')) {
        if (hideTools === 'hide') {
            return ['main'];
        }
        return [{ type: 'main' }, { type: 'ai_tool', displayName: 'Tools' }];
    }
    return ['main'];
};
exports.configureNodeInputs = configureNodeInputs;
//# sourceMappingURL=description.js.map