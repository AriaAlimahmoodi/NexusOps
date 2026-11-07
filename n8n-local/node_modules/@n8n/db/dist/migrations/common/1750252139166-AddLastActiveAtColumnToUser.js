"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLastActiveAtColumnToUser1750252139166 = void 0;
const columnName = 'lastActiveAt';
const tableName = 'user';
class AddLastActiveAtColumnToUser1750252139166 {
    async up({ escape, runQuery }) {
        const escapedTableName = escape.tableName(tableName);
        const escapedColumnName = escape.columnName(columnName);
        await runQuery(`ALTER TABLE ${escapedTableName} ADD COLUMN ${escapedColumnName} DATE NULL`);
    }
    async down({ escape, runQuery }) {
        const escapedTableName = escape.tableName(tableName);
        const escapedColumnName = escape.columnName(columnName);
        await runQuery(`ALTER TABLE ${escapedTableName} DROP COLUMN ${escapedColumnName}`);
    }
}
exports.AddLastActiveAtColumnToUser1750252139166 = AddLastActiveAtColumnToUser1750252139166;
//# sourceMappingURL=1750252139166-AddLastActiveAtColumnToUser.js.map