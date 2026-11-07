"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddStoredAtToExecutionEntity1768557000000 = void 0;
class AddStoredAtToExecutionEntity1768557000000 {
    async up({ escape, runQuery }) {
        const executionEntity = escape.tableName('execution_entity');
        const storedAt = escape.columnName('storedAt');
        await runQuery(`ALTER TABLE ${executionEntity} ADD COLUMN ${storedAt} VARCHAR(2) NOT NULL DEFAULT 'db' CHECK(${storedAt} IN ('db', 'fs', 's3'))`);
    }
    async down({ escape, runQuery }) {
        const executionEntity = escape.tableName('execution_entity');
        const storedAt = escape.columnName('storedAt');
        await runQuery(`ALTER TABLE ${executionEntity} DROP COLUMN ${storedAt}`);
    }
}
exports.AddStoredAtToExecutionEntity1768557000000 = AddStoredAtToExecutionEntity1768557000000;
//# sourceMappingURL=1768557000000-AddStoredAtToExecutionEntity.js.map