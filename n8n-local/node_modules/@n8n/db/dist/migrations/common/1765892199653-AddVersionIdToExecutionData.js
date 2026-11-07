"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkflowVersionIdToExecutionData1765892199653 = void 0;
class AddWorkflowVersionIdToExecutionData1765892199653 {
    async up({ runQuery, escape }) {
        const tableName = escape.tableName('execution_data');
        const workflowVersionId = escape.columnName('workflowVersionId');
        await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${workflowVersionId} VARCHAR(36)`);
    }
    async down({ runQuery, escape }) {
        const tableName = escape.tableName('execution_data');
        const workflowVersionId = escape.columnName('workflowVersionId');
        await runQuery(`ALTER TABLE ${tableName} DROP COLUMN ${workflowVersionId}`);
    }
}
exports.AddWorkflowVersionIdToExecutionData1765892199653 = AddWorkflowVersionIdToExecutionData1765892199653;
//# sourceMappingURL=1765892199653-AddVersionIdToExecutionData.js.map