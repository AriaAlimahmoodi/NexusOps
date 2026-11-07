"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpandInsightsWorkflowIdLength1766500000000 = void 0;
class ExpandInsightsWorkflowIdLength1766500000000 {
    async up({ escape, queryRunner }) {
        const tableName = escape.tableName('insights_metadata');
        const columnName = escape.columnName('workflowId');
        await queryRunner.query(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE VARCHAR(36);`);
    }
}
exports.ExpandInsightsWorkflowIdLength1766500000000 = ExpandInsightsWorkflowIdLength1766500000000;
//# sourceMappingURL=1766500000000-ExpandInsightsWorkflowIdLength.js.map