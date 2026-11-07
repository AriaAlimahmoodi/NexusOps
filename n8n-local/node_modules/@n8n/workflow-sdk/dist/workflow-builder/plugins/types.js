"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMapKey = findMapKey;
exports.isAutoRenamed = isAutoRenamed;
exports.formatNodeRef = formatNodeRef;
function findMapKey(graphNode, ctx) {
    for (const [mapKey, node] of ctx.nodes) {
        if (node === graphNode) {
            return mapKey;
        }
    }
    return graphNode.instance.name;
}
function isAutoRenamed(mapKey, originalName) {
    if (mapKey === originalName)
        return false;
    if (!mapKey.startsWith(originalName + ' '))
        return false;
    const suffix = mapKey.slice(originalName.length + 1);
    return /^\d+$/.test(suffix);
}
function formatNodeRef(displayName, originalName, nodeType) {
    const typeSuffix = nodeType ? ` [${nodeType}]` : '';
    if (originalName && originalName !== displayName) {
        return `'${displayName}' (originally '${originalName}')${typeSuffix}`;
    }
    return `'${displayName}'${typeSuffix}`;
}
//# sourceMappingURL=types.js.map