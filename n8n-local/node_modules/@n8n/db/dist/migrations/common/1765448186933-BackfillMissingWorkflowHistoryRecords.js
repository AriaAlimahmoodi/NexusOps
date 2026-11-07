"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackfillMissingWorkflowHistoryRecords1765448186933 = void 0;
class BackfillMissingWorkflowHistoryRecords1765448186933 {
    async up({ escape, runQuery }) {
        const workflowTable = escape.tableName('workflow_entity');
        const historyTable = escape.tableName('workflow_history');
        const versionIdColumn = escape.columnName('versionId');
        const idColumn = escape.columnName('id');
        const workflowIdColumn = escape.columnName('workflowId');
        const nodesColumn = escape.columnName('nodes');
        const connectionsColumn = escape.columnName('connections');
        const authorsColumn = escape.columnName('authors');
        const createdAtColumn = escape.columnName('createdAt');
        const updatedAtColumn = escape.columnName('updatedAt');
        await runQuery(`
            INSERT INTO ${historyTable} (
                ${versionIdColumn},
                ${workflowIdColumn},
                ${authorsColumn},
                ${nodesColumn},
                ${connectionsColumn},
                ${createdAtColumn},
                ${updatedAtColumn}
            )
            SELECT
                w.${versionIdColumn},
                w.${idColumn},
                :authors,
                w.${nodesColumn},
                w.${connectionsColumn},
                :createdAt,
                :updatedAt
            FROM ${workflowTable} w
            LEFT JOIN ${historyTable} wh
                ON w.${versionIdColumn} = wh.${versionIdColumn}
            WHERE wh.${versionIdColumn} IS NULL
            `, {
            authors: 'system migration',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
}
exports.BackfillMissingWorkflowHistoryRecords1765448186933 = BackfillMissingWorkflowHistoryRecords1765448186933;
//# sourceMappingURL=1765448186933-BackfillMissingWorkflowHistoryRecords.js.map