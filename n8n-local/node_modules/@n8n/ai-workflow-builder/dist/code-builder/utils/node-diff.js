"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNodeChanges = calculateNodeChanges;
function calculateNodeChanges(before, after) {
    const beforeNodes = before?.nodes ?? [];
    const afterNodes = after?.nodes ?? [];
    const beforeNodesWithNames = beforeNodes.filter((n) => !!n.name);
    const afterNodesWithNames = afterNodes.filter((n) => !!n.name);
    const beforeNames = new Set(beforeNodesWithNames.map((n) => n.name));
    const afterNames = new Set(afterNodesWithNames.map((n) => n.name));
    const nodes_added = [...afterNames].filter((n) => !beforeNames.has(n)).length;
    const nodes_removed = [...beforeNames].filter((n) => !afterNames.has(n)).length;
    const beforeMap = new Map(beforeNodesWithNames.map((n) => [n.name, JSON.stringify(n)]));
    const nodes_modified = [...afterNames].filter((name) => {
        if (!beforeNames.has(name))
            return false;
        const afterNode = afterNodesWithNames.find((n) => n.name === name);
        return beforeMap.get(name) !== JSON.stringify(afterNode);
    }).length;
    return { nodes_added, nodes_removed, nodes_modified };
}
//# sourceMappingURL=node-diff.js.map