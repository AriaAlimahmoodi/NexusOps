"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeDefaultForIdInUserTable1762771264000 = void 0;
class ChangeDefaultForIdInUserTable1762771264000 {
    async up({ queryRunner, escape }) {
        const tableName = escape.tableName('user');
        const idColumnName = escape.columnName('id');
        await queryRunner.query(`ALTER TABLE ${tableName} ALTER COLUMN ${idColumnName} SET DEFAULT gen_random_uuid()`);
    }
}
exports.ChangeDefaultForIdInUserTable1762771264000 = ChangeDefaultForIdInUserTable1762771264000;
//# sourceMappingURL=1762771264000-ChangeDefaultForIdInUserTable.js.map