"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowTriggerToN8nTrigger = void 0;
exports.workflowTriggerToN8nTrigger = {
    ruleId: 'workflow-trigger-removed-v3',
    migrate: (node) => {
        const { events = [] } = node.parameters;
        if (!Array.isArray(events) ||
            !events.every((event) => event === 'activate' || event === 'update')) {
            throw new Error('"Events" is an expression or has an unsupported value, so the node cannot be migrated automatically.');
        }
        return {
            node: {
                type: 'n8n-nodes-base.n8nTrigger',
                typeVersion: 1,
                parameters: { events },
            },
            notes: events.includes('activate')
                ? [
                    'The event text for activation changed from "Workflow activated" to "Workflow published".',
                ]
                : undefined,
        };
    },
};
//# sourceMappingURL=workflow-trigger-to-n8n-trigger.migration.js.map