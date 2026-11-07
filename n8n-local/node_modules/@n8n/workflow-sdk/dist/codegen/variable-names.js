"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVED_KEYWORDS = void 0;
exports.toVarName = toVarName;
exports.getVarName = getVarName;
exports.getUniqueVarName = getUniqueVarName;
exports.RESERVED_KEYWORDS = new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'return',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'null',
    'true',
    'false',
    'undefined',
    'workflow',
    'trigger',
    'node',
    'merge',
    'ifElse',
    'switchCase',
    'splitInBatches',
    'sticky',
    'languageModel',
    'tool',
    'memory',
    'outputParser',
    'textSplitter',
    'embeddings',
    'vectorStore',
    'retriever',
    'document',
    'eval',
    'Function',
    'require',
    'process',
    'global',
    'globalThis',
    'window',
    'setTimeout',
    'setInterval',
    'setImmediate',
    'clearTimeout',
    'clearInterval',
    'clearImmediate',
    'module',
    'exports',
    'Buffer',
    'Reflect',
    'Proxy',
]);
function hashFallbackName(nodeName) {
    let hash = 0;
    for (let i = 0; i < nodeName.length; i++) {
        hash = ((hash << 5) - hash + nodeName.charCodeAt(i)) | 0;
    }
    return 'node_' + Math.abs(hash).toString(36);
}
function toVarName(nodeName) {
    let varName = nodeName
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/_$/g, '')
        .replace(/^([A-Z])/, (c) => c.toLowerCase());
    if (!varName || varName === '_') {
        return hashFallbackName(nodeName);
    }
    if (/^\d/.test(varName)) {
        varName = '_' + varName;
    }
    if (/^_[a-zA-Z]/.test(varName)) {
        varName = varName.slice(1);
    }
    if (exports.RESERVED_KEYWORDS.has(varName)) {
        varName = varName + '_node';
    }
    return varName;
}
function getVarName(nodeName, ctx) {
    if (ctx.nodeNameToVarName.has(nodeName)) {
        return ctx.nodeNameToVarName.get(nodeName);
    }
    return toVarName(nodeName);
}
function getUniqueVarName(nodeName, ctx) {
    if (ctx.nodeNameToVarName.has(nodeName)) {
        return ctx.nodeNameToVarName.get(nodeName);
    }
    const baseVarName = toVarName(nodeName);
    let varName = baseVarName;
    let counter = 1;
    while (ctx.usedVarNames.has(varName)) {
        varName = `${baseVarName}${counter}`;
        counter++;
    }
    ctx.usedVarNames.add(varName);
    ctx.nodeNameToVarName.set(nodeName, varName);
    return varName;
}
//# sourceMappingURL=variable-names.js.map