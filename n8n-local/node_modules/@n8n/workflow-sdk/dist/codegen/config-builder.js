"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildConfigString = buildConfigString;
exports.buildConfigStringMultiline = buildConfigStringMultiline;
function buildConfigString(entries) {
    const includedEntries = entries.filter((e) => e.condition);
    if (includedEntries.length === 0) {
        return '{}';
    }
    const parts = includedEntries.map((e) => `${e.key}: ${e.value}`);
    return `{ ${parts.join(', ')} }`;
}
function buildConfigStringMultiline(entries, indent = '') {
    const includedEntries = entries.filter((e) => e.condition);
    if (includedEntries.length === 0) {
        return '{}';
    }
    const innerIndent = indent + '  ';
    const parts = includedEntries.map((e) => `${innerIndent}${e.key}: ${e.value}`);
    return `{\n${parts.join(',\n')}\n${indent}}`;
}
//# sourceMappingURL=config-builder.js.map