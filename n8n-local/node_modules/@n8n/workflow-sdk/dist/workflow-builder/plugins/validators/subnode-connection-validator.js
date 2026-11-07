"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subnodeConnectionValidator = void 0;
const types_1 = require("../types");
const SUBNODE_TYPE_PATTERNS = [
    { prefix: 'embeddings', connectionType: 'ai_embedding', subnodeField: 'embedding' },
    { prefix: 'lm', connectionType: 'ai_languageModel', subnodeField: 'model' },
    { prefix: 'memory', connectionType: 'ai_memory', subnodeField: 'memory' },
    { prefix: 'outputParser', connectionType: 'ai_outputParser', subnodeField: 'outputParser' },
    { prefix: 'document', connectionType: 'ai_document', subnodeField: 'documentLoader' },
    { prefix: 'textSplitter', connectionType: 'ai_textSplitter', subnodeField: 'textSplitter' },
    { prefix: 'reranker', connectionType: 'ai_reranker', subnodeField: 'reranker' },
];
function getRequiredSubnodeInfo(nodeType) {
    const parts = nodeType.split('.');
    const nodeName = parts.length > 1 ? parts[parts.length - 1] : nodeType;
    for (const pattern of SUBNODE_TYPE_PATTERNS) {
        if (nodeName.startsWith(pattern.prefix)) {
            return { connectionType: pattern.connectionType, subnodeField: pattern.subnodeField };
        }
    }
    return null;
}
function hasAiConnectionOfType(graphNode, connectionType) {
    const outputMap = graphNode.connections.get(connectionType);
    if (!outputMap)
        return false;
    for (const targets of outputMap.values()) {
        if (targets.length > 0) {
            return true;
        }
    }
    return false;
}
exports.subnodeConnectionValidator = {
    id: 'core:subnode-connection',
    name: 'Subnode Connection Validator',
    priority: 20,
    validateNode: () => [],
    validateWorkflow(ctx) {
        const issues = [];
        for (const [mapKey, graphNode] of ctx.nodes) {
            const subnodeInfo = getRequiredSubnodeInfo(graphNode.instance.type);
            if (subnodeInfo) {
                if (!hasAiConnectionOfType(graphNode, subnodeInfo.connectionType)) {
                    const originalName = graphNode.instance.name;
                    const renamed = (0, types_1.isAutoRenamed)(mapKey, originalName);
                    const displayName = renamed ? mapKey : originalName;
                    const origForDisplay = renamed ? originalName : undefined;
                    const nodeRef = (0, types_1.formatNodeRef)(displayName, origForDisplay, graphNode.instance.type);
                    issues.push({
                        code: 'SUBNODE_NOT_CONNECTED',
                        message: `${nodeRef} is a subnode that must be connected to a parent node as ${subnodeInfo.subnodeField}, but it has no such connection. Use the appropriate subnode factory (e.g., embedding(), languageModel()) and connect it to a parent node's subnodes config.`,
                        severity: 'error',
                        nodeName: displayName,
                        originalName: origForDisplay,
                    });
                }
            }
        }
        return issues;
    },
};
//# sourceMappingURL=subnode-connection-validator.js.map