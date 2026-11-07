"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupNodesByType = groupNodesByType;
function groupNodesByType(nodes) {
    const grouped = new Map();
    for (const node of nodes) {
        const existing = grouped.get(node.type);
        if (existing)
            existing.push(node);
        else
            grouped.set(node.type, [node]);
    }
    return grouped;
}
//# sourceMappingURL=group-nodes-by-type.js.map