"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDataStoreTables1754475614601 = void 0;
const DATA_STORE_TABLE_NAME = 'data_store';
const DATA_STORE_COLUMN_TABLE_NAME = 'data_store_column';
class CreateDataStoreTables1754475614601 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable(DATA_STORE_TABLE_NAME)
            .withColumns(column('id').varchar(36).primary, column('name').varchar(128).notNull, column('projectId').varchar(36).notNull, column('sizeBytes').int.default(0).notNull)
            .withForeignKey('projectId', {
            tableName: 'project',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withUniqueConstraintOn(['projectId', 'name']).withTimestamps;
        await createTable(DATA_STORE_COLUMN_TABLE_NAME)
            .withColumns(column('id').varchar(36).primary.notNull, column('name').varchar(128).notNull, column('type')
            .varchar(32)
            .notNull.comment('Expected: string, number, boolean, or date (not enforced as a constraint)'), column('index').int.notNull.comment('Column order, starting from 0 (0 = first column)'), column('dataStoreId').varchar(36).notNull)
            .withForeignKey('dataStoreId', {
            tableName: DATA_STORE_TABLE_NAME,
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withUniqueConstraintOn(['dataStoreId', 'name']).withTimestamps;
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable(DATA_STORE_COLUMN_TABLE_NAME);
        await dropTable(DATA_STORE_TABLE_NAME);
    }
}
exports.CreateDataStoreTables1754475614601 = CreateDataStoreTables1754475614601;
//# sourceMappingURL=1754475614601-CreateDataStoreTables.js.map