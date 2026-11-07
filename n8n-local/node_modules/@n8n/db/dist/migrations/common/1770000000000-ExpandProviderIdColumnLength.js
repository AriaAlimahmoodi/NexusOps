"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpandProviderIdColumnLength1770000000000 = void 0;
class ExpandProviderIdColumnLength1770000000000 {
    async up({ isPostgres, escape, queryRunner }) {
        if (isPostgres) {
            const table = escape.tableName('auth_identity');
            const column = escape.columnName('providerId');
            await queryRunner.query(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE VARCHAR(255);`);
        }
    }
}
exports.ExpandProviderIdColumnLength1770000000000 = ExpandProviderIdColumnLength1770000000000;
//# sourceMappingURL=1770000000000-ExpandProviderIdColumnLength.js.map