"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWorkflowPublishedVersionTable1769698710000 = void 0;
class CreateWorkflowPublishedVersionTable1769698710000 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable('workflow_published_version')
            .withColumns(column('workflowId').varchar(36).primary.notNull, column('publishedVersionId').varchar(36).notNull)
            .withForeignKey('workflowId', {
            tableName: 'workflow_entity',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('publishedVersionId', {
            tableName: 'workflow_history',
            columnName: 'versionId',
            onDelete: 'CASCADE',
        }).withTimestamps;
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable('workflow_published_version');
    }
}
exports.CreateWorkflowPublishedVersionTable1769698710000 = CreateWorkflowPublishedVersionTable1769698710000;
//# sourceMappingURL=1769698710000-CreateWorkflowPublishedVersionTable.js.map