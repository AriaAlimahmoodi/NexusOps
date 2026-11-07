"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDynamicCredentialResolverTable1764682447000 = void 0;
const tableName = 'dynamic_credential_resolver';
class CreateDynamicCredentialResolverTable1764682447000 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable(tableName)
            .withColumns(column('id').varchar(16).primary, column('name').varchar(128).notNull, column('type').varchar(128).notNull, column('config').text.notNull.comment('Encrypted resolver configuration (JSON encrypted as string)'))
            .withTimestamps.withIndexOn('type');
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable(tableName);
    }
}
exports.CreateDynamicCredentialResolverTable1764682447000 = CreateDynamicCredentialResolverTable1764682447000;
//# sourceMappingURL=1764682447000-CreateCredentialResolverTable.js.map