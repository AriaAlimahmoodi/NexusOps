"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareSkillFilePaths = compareSkillFilePaths;
exports.skillContentHash = skillContentHash;
const node_crypto_1 = require("node:crypto");
function compareSkillFilePaths(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
}
function sortKeys(value) {
    if (Array.isArray(value))
        return value.map(sortKeys);
    if (value === null || typeof value !== 'object')
        return value;
    return Object.fromEntries(Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, sortKeys(entry)]));
}
function skillContentHash(content) {
    return (0, node_crypto_1.createHash)('sha256')
        .update(JSON.stringify({
        name: content.name,
        description: content.description,
        instructions: content.instructions,
        frontmatter: content.frontmatter ? sortKeys(content.frontmatter) : null,
        files: content.files
            .map((file) => [file.path, file.content])
            .sort(([left], [right]) => compareSkillFilePaths(left, right)),
    }))
        .digest('hex');
}
//# sourceMappingURL=skill-content-hash.js.map