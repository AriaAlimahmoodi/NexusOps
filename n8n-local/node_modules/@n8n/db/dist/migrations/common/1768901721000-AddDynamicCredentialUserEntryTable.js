"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDynamicCredentialUserEntryTable1768901721000 = void 0;
const tableName = 'dynamic_credential_user_entry';
class AddDynamicCredentialUserEntryTable1768901721000 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable(tableName)
            .withColumns(column('credentialId').varchar(16).primary.notNull, column('userId').uuid.primary.notNull, column('resolverId').varchar(16).primary.notNull, column('data').text.notNull)
            .withTimestamps.withForeignKey('credentialId', {
            tableName: 'credentials_entity',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('resolverId', {
            tableName: 'dynamic_credential_resolver',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('userId', {
            tableName: 'user',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withIndexOn(['userId'])
            .withIndexOn(['resolverId']);
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable(tableName);
    }
}
exports.AddDynamicCredentialUserEntryTable1768901721000 = AddDynamicCredentialUserEntryTable1768901721000;
//# sourceMappingURL=1768901721000-AddDynamicCredentialUserEntryTable.js.map