"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWorkflowBuilderSessionTable1770220686000 = void 0;
class CreateWorkflowBuilderSessionTable1770220686000 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable('workflow_builder_session')
            .withColumns(column('id').uuid.primary.notNull, column('workflowId').varchar(36).notNull, column('userId').uuid.notNull, column('messages').json.notNull.default("'[]'"), column('previousSummary').text.comment('Summary of prior conversation from compaction (/compact or auto-compact)'))
            .withForeignKey('workflowId', {
            tableName: 'workflow_entity',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('userId', {
            tableName: 'user',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withUniqueConstraintOn(['workflowId', 'userId']).withTimestamps;
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable('workflow_builder_session');
    }
}
exports.CreateWorkflowBuilderSessionTable1770220686000 = CreateWorkflowBuilderSessionTable1770220686000;
//# sourceMappingURL=1770220686000-CreateWorkflowBuilderSessionTable.js.map