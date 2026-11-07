"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noNodesValidator = void 0;
exports.noNodesValidator = {
    id: 'core:no-nodes',
    name: 'No Nodes Validator',
    priority: 100,
    validateNode: () => [],
    validateWorkflow(ctx) {
        if (ctx.nodes.size === 0) {
            return [
                {
                    code: 'NO_NODES',
                    message: 'Workflow has no nodes',
                    severity: 'error',
                    violationLevel: 'critical',
                },
            ];
        }
        return [];
    },
};
//# sourceMappingURL=no-nodes-validator.js.map