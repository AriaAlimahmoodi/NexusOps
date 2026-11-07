"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSecretsProviderConnectionTables1769433700000 = void 0;
const secretsProviderConnectionTable = 'secrets_provider_connection';
const projectSecretsProviderAccessTable = 'project_secrets_provider_access';
class CreateSecretsProviderConnectionTables1769433700000 {
    async up({ schemaBuilder: { createTable, column, createIndex } }) {
        await createTable(secretsProviderConnectionTable).withColumns(column('id').int.primary.autoGenerate2, column('providerKey').varchar(128).notNull, column('type')
            .varchar(36)
            .notNull.comment('Type of secrets provider. Possible values: awsSecretsManager, gcpSecretsManager, vault, azureKeyVault, infisical'), column('encryptedSettings').text.notNull, column('isEnabled').bool.default(false).notNull).withTimestamps;
        await createIndex(secretsProviderConnectionTable, ['providerKey'], true);
        await createTable(projectSecretsProviderAccessTable)
            .withColumns(column('secretsProviderConnectionId').int.primary.notNull, column('projectId').varchar(36).primary.notNull)
            .withTimestamps.withForeignKey('secretsProviderConnectionId', {
            tableName: secretsProviderConnectionTable,
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('projectId', {
            tableName: 'project',
            columnName: 'id',
            onDelete: 'CASCADE',
        });
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable(projectSecretsProviderAccessTable);
        await dropTable(secretsProviderConnectionTable);
    }
}
exports.CreateSecretsProviderConnectionTables1769433700000 = CreateSecretsProviderConnectionTables1769433700000;
//# sourceMappingURL=1769433700000-CreateSecretsProvidersConnectionTables.js.map