"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOAuthEntities1760116750277 = void 0;
class CreateOAuthEntities1760116750277 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable('oauth_clients').withColumns(column('id').varchar().primary.notNull, column('name').varchar(255).notNull, column('redirectUris').json.notNull, column('grantTypes').json.notNull, column('clientSecret').varchar(255), column('clientSecretExpiresAt').bigint, column('tokenEndpointAuthMethod')
            .varchar(255)
            .notNull.default("'none'")
            .comment('Possible values: none, client_secret_basic or client_secret_post')).withTimestamps;
        await createTable('oauth_authorization_codes')
            .withColumns(column('code').varchar(255).primary.notNull, column('clientId').varchar().notNull, column('userId').uuid.notNull, column('redirectUri').varchar(255).notNull, column('codeChallenge').varchar(255).notNull, column('codeChallengeMethod').varchar(255).notNull, column('expiresAt').bigint.notNull.comment('Unix timestamp in milliseconds'), column('state').varchar(255), column('used').bool.notNull.default(false))
            .withForeignKey('clientId', {
            tableName: 'oauth_clients',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('userId', {
            tableName: 'user',
            columnName: 'id',
            onDelete: 'CASCADE',
        }).withTimestamps;
        await createTable('oauth_access_tokens')
            .withColumns(column('token').varchar().primary.notNull, column('clientId').varchar().notNull, column('userId').uuid.notNull)
            .withForeignKey('clientId', {
            tableName: 'oauth_clients',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('userId', {
            tableName: 'user',
            columnName: 'id',
            onDelete: 'CASCADE',
        });
        await createTable('oauth_refresh_tokens')
            .withColumns(column('token').varchar(255).primary.notNull, column('clientId').varchar().notNull, column('userId').uuid.notNull, column('expiresAt').bigint.notNull.comment('Unix timestamp in milliseconds'))
            .withForeignKey('clientId', {
            tableName: 'oauth_clients',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('userId', {
            tableName: 'user',
            columnName: 'id',
            onDelete: 'CASCADE',
        }).withTimestamps;
        await createTable('oauth_user_consents')
            .withColumns(column('id').int.primary.autoGenerate2.notNull, column('userId').uuid.notNull, column('clientId').varchar().notNull, column('grantedAt').bigint.notNull.comment('Unix timestamp in milliseconds'))
            .withForeignKey('clientId', {
            tableName: 'oauth_clients',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withForeignKey('userId', {
            tableName: 'user',
            columnName: 'id',
            onDelete: 'CASCADE',
        })
            .withUniqueConstraintOn(['userId', 'clientId']);
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable('oauth_user_consents');
        await dropTable('oauth_refresh_tokens');
        await dropTable('oauth_access_tokens');
        await dropTable('oauth_authorization_codes');
        await dropTable('oauth_clients');
    }
}
exports.CreateOAuthEntities1760116750277 = CreateOAuthEntities1760116750277;
//# sourceMappingURL=1760116750277-CreateOAuthEntities.js.map