"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpandSubjectIDColumnLength1769784356000 = void 0;
const tmpTableName = 'tmp_dynamic_credential_entry';
const tableName = 'dynamic_credential_entry';
class ExpandSubjectIDColumnLength1769784356000 {
    async up({ copyTable, escape, queryRunner, schemaBuilder: { createTable, column, dropTable }, }) {
        const escapedTableName = escape.tableName(tableName);
        const escapedTmpTableName = escape.tableName(tmpTableName);
        await createTable(tmpTableName)
            .withColumns(column('credential_id').varchar(16).primary.notNull, column('subject_id').varchar(2048).primary.notNull, column('resolver_id').varchar(16).primary.notNull, column('data').text.notNull)
            .withTimestamps.withForeignKey('credential_id', {
            tableName: 'credentials_entity',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('resolver_id', {
            tableName: 'dynamic_credential_resolver',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withIndexOn(['subject_id'])
            .withIndexOn(['resolver_id']);
        await copyTable(tableName, tmpTableName);
        await dropTable(tableName);
        await queryRunner.query(`ALTER TABLE ${escapedTmpTableName} RENAME TO ${escapedTableName};`);
    }
}
exports.ExpandSubjectIDColumnLength1769784356000 = ExpandSubjectIDColumnLength1769784356000;
//# sourceMappingURL=1769784356000-ExpandSubjectIDColumnLength.js.map