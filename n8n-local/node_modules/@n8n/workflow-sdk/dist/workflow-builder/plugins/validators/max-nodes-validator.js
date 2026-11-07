"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxNodesValidator = void 0;
const string_utils_1 = require("../../string-utils");
exports.maxNodesValidator = {
    id: 'core:max-nodes',
    name: 'Max Nodes Validator',
    priority: 80,
    validateNode: () => [],
    validateWorkflow(ctx) {
        const provider = ctx.validationOptions?.nodeTypesProvider;
        if (!provider)
            return [];
        const issues = [];
        const nodeCountByType = new Map();
        for (const graphNode of ctx.nodes.values()) {
            const type = graphNode.instance.type;
            nodeCountByType.set(type, (nodeCountByType.get(type) ?? 0) + 1);
        }
        for (const [type, count] of nodeCountByType) {
            if (count <= 1)
                continue;
            const firstNode = [...ctx.nodes.values()].find((n) => n.instance.type === type);
            const versionRaw = firstNode?.instance.version;
            const version = (0, string_utils_1.parseVersion)(versionRaw);
            const nodeType = provider.getByNameAndVersion(type, version);
            const maxNodes = nodeType?.description?.maxNodes;
            if (maxNodes !== undefined && count > maxNodes) {
                const displayName = nodeType?.description?.displayName ?? type;
                issues.push({
                    code: 'MAX_NODES_EXCEEDED',
                    message: `Workflow has ${count} ${displayName} nodes. Maximum allowed is ${maxNodes}.`,
                    severity: 'error',
                });
            }
        }
        return issues;
    },
};
//# sourceMappingURL=max-nodes-validator.js.map