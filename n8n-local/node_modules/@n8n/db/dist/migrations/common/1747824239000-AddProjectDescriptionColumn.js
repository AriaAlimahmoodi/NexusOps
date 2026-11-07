"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProjectDescriptionColumn1747824239000 = void 0;
const columnName = 'description';
const tableName = 'project';
class AddProjectDescriptionColumn1747824239000 {
    async up({ escape, runQuery }) {
        const escapedTableName = escape.tableName(tableName);
        const escapedColumnName = escape.columnName(columnName);
        await runQuery(`ALTER TABLE ${escapedTableName} ADD COLUMN ${escapedColumnName} VARCHAR(512)`);
    }
    async down({ escape, runQuery }) {
        const escapedTableName = escape.tableName(tableName);
        const escapedColumnName = escape.columnName(columnName);
        await runQuery(`ALTER TABLE ${escapedTableName} DROP COLUMN ${escapedColumnName}`);
    }
}
exports.AddProjectDescriptionColumn1747824239000 = AddProjectDescriptionColumn1747824239000;
//# sourceMappingURL=1747824239000-AddProjectDescriptionColumn.js.map