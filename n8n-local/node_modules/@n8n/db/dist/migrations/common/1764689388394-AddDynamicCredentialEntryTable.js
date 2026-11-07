"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDynamicCredentialEntryTable1764689388394 = void 0;
const tableName = 'dynamic_credential_entry';
class AddDynamicCredentialEntryTable1764689388394 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable(tableName)
            .withColumns(column('credential_id').varchar(16).primary.notNull, column('subject_id').varchar(16).primary.notNull, column('resolver_id').varchar(16).primary.notNull, column('data').text.notNull)
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
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable(tableName);
    }
}
exports.AddDynamicCredentialEntryTable1764689388394 = AddDynamicCredentialEntryTable1764689388394;
//# sourceMappingURL=1764689388394-AddDynamicCredentialEntryTable.js.map