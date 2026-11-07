"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkflowMigration = exports.WorkflowMigrationNodeError = void 0;
exports.replaceAffectedNodes = replaceAffectedNodes;
const errors_1 = require("@n8n/errors");
class WorkflowMigrationNodeError extends errors_1.BadRequestError {
    constructor(message, meta) {
        super(message);
        this.meta = meta;
        this.name = 'WorkflowMigrationNodeError';
    }
}
exports.WorkflowMigrationNodeError = WorkflowMigrationNodeError;
function replaceAffectedNodes(nodes, affectedNodeIds, migrateNode) {
    const migratedNodeIds = [];
    const migratedNodes = nodes.map((node) => {
        if (!affectedNodeIds.has(node.id))
            return node;
        try {
            const migrated = migrateNode(node);
            migratedNodeIds.push(node.id);
            return migrated;
        }
        catch (error) {
            throw new WorkflowMigrationNodeError(error instanceof Error ? error.message : 'Migration failed.', { nodeId: node.id, nodeName: node.name });
        }
    });
    return { nodes: migratedNodes, migratedNodeIds };
}
const isWorkflowMigration = (migration) => 'migrateWorkflow' in migration;
exports.isWorkflowMigration = isWorkflowMigration;
//# sourceMappingURL=node-migration.js.map