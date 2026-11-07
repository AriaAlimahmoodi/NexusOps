"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddIsGlobalColumnToCredentialsTable1762771954619 = void 0;
class AddIsGlobalColumnToCredentialsTable1762771954619 {
    async up({ escape, runQuery, isSqlite }) {
        const tableName = escape.tableName('credentials_entity');
        const columnName = escape.columnName('isGlobal');
        const defaultValue = isSqlite ? 0 : 'FALSE';
        await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} BOOLEAN NOT NULL DEFAULT ${defaultValue}`);
    }
    async down({ escape, runQuery }) {
        const tableName = escape.tableName('credentials_entity');
        const columnName = escape.columnName('isGlobal');
        await runQuery(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
    }
}
exports.AddIsGlobalColumnToCredentialsTable1762771954619 = AddIsGlobalColumnToCredentialsTable1762771954619;
//# sourceMappingURL=1762771954619-IsGlobalGlobalColumnToCredentialsTable.js.map