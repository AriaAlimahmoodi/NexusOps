"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectNodeTypeUsage = collectNodeTypeUsage;
function collectNodeTypeUsage(sources) {
    const usage = new Map();
    for (const source of sources) {
        for (const node of source.nodes) {
            const key = `${node.type}@${node.typeVersion}`;
            const entry = usage.get(key) ?? {
                type: node.type,
                typeVersion: node.typeVersion,
                workflowIds: new Set(),
                agentIds: new Set(),
            };
            if ('workflowId' in source)
                entry.workflowIds.add(source.workflowId);
            else
                entry.agentIds.add(source.agentId);
            usage.set(key, entry);
        }
    }
    return [...usage.values()].map(({ type, typeVersion, workflowIds, agentIds }) => ({
        type,
        typeVersion,
        usedBy: [
            ...[...workflowIds].map((id) => ({ kind: 'workflow', id })),
            ...[...agentIds].map((id) => ({ kind: 'agent', id })),
        ],
    }));
}
//# sourceMappingURL=node-type-usage.js.map