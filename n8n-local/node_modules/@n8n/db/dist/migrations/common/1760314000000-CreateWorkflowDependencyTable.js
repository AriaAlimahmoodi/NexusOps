"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWorkflowDependencyTable1760314000000 = void 0;
class CreateWorkflowDependencyTable1760314000000 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable('workflow_dependency')
            .withColumns(column('id').int.primary.autoGenerate2, column('workflowId').varchar(36).notNull, column('workflowVersionId').int.notNull.comment('Version of the workflow'), column('dependencyType')
            .varchar(32)
            .notNull.comment('Type of dependency: "credential", "nodeType", "webhookPath", or "workflowCall"'), column('dependencyKey').varchar(255).notNull.comment('ID or name of the dependency'), column('dependencyInfo')
            .varchar(255)
            .comment('Additional info about the dependency, interpreted based on type'), column('indexVersionId')
            .smallint.notNull.default(1)
            .comment('Version of the index structure'))
            .withForeignKey('workflowId', {
            tableName: 'workflow_entity',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withIndexOn(['workflowId'])
            .withIndexOn(['dependencyType'])
            .withIndexOn(['dependencyKey']).withCreatedAt;
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable('workflow_dependency');
    }
}
exports.CreateWorkflowDependencyTable1760314000000 = CreateWorkflowDependencyTable1760314000000;
//# sourceMappingURL=1760314000000-CreateWorkflowDependencyTable.js.map