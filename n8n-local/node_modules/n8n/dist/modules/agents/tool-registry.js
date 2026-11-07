"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildToolRegistry = buildToolRegistry;
function buildToolRegistry(tools) {
    const registry = new Map();
    for (const tool of tools) {
        const m = tool.metadata;
        if (m !== undefined &&
            m.kind === 'workflow' &&
            typeof m.workflowId === 'string' &&
            typeof m.workflowName === 'string') {
            const entry = {
                kind: 'workflow',
                workflowId: m.workflowId,
                workflowName: m.workflowName,
            };
            if (typeof m.triggerType === 'string') {
                entry.triggerType = m.triggerType;
            }
            registry.set(tool.name, entry);
        }
        else if (m !== undefined && m.kind === 'node' && typeof m.nodeType === 'string') {
            const entry = {
                kind: 'node',
                nodeType: m.nodeType,
            };
            if (typeof m.nodeTypeVersion === 'number')
                entry.nodeTypeVersion = m.nodeTypeVersion;
            if (typeof m.displayName === 'string')
                entry.nodeDisplayName = m.displayName;
            if (m.nodeParameters && typeof m.nodeParameters === 'object') {
                entry.nodeParameters = m.nodeParameters;
            }
            registry.set(tool.name, entry);
        }
        else {
            registry.set(tool.name, { kind: 'tool' });
        }
    }
    return registry;
}
//# sourceMappingURL=tool-registry.js.map