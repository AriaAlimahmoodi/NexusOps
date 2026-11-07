"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUnshareScopeToCustomRoles1771500000001 = void 0;
const PERSONAL_OWNER_ROLE_SLUG = 'project:personalOwner';
class AddUnshareScopeToCustomRoles1771500000001 {
    async up({ escape, runQuery }) {
        const scopeTableName = escape.tableName('scope');
        const scopeSlugColumn = escape.columnName('slug');
        const displayNameColumn = escape.columnName('displayName');
        const descriptionColumn = escape.columnName('description');
        const roleTableName = escape.tableName('role');
        const roleScopeTableName = escape.tableName('role_scope');
        const roleSlugColumn = escape.columnName('slug');
        const roleScopeRoleSlugColumn = escape.columnName('roleSlug');
        const roleScopeScopeSlugColumn = escape.columnName('scopeSlug');
        const insertScopeQuery = `INSERT INTO ${scopeTableName} (${scopeSlugColumn}, ${displayNameColumn}, ${descriptionColumn})
         VALUES (:slug, :displayName, :description)
         ON CONFLICT (${scopeSlugColumn}) DO NOTHING`;
        await runQuery(insertScopeQuery, {
            slug: 'workflow:unshare',
            displayName: 'Unshare Workflow',
            description: 'Allows removing workflow shares.',
        });
        await runQuery(insertScopeQuery, {
            slug: 'credential:unshare',
            displayName: 'Unshare Credential',
            description: 'Allows removing credential shares.',
        });
        const batchInsertQuery = `
		INSERT INTO ${roleScopeTableName} (${roleScopeRoleSlugColumn}, ${roleScopeScopeSlugColumn})
		SELECT DISTINCT role.${roleSlugColumn}, :unshareScope
		FROM ${roleTableName} role
		INNER JOIN ${roleScopeTableName} role_scope
			ON role.${roleSlugColumn} = role_scope.${roleScopeRoleSlugColumn}
		WHERE role.${roleSlugColumn} != :personalOwnerSlug
			AND role_scope.${roleScopeScopeSlugColumn} = :shareScope
		ON CONFLICT (${roleScopeRoleSlugColumn}, ${roleScopeScopeSlugColumn}) DO NOTHING
		`;
        await runQuery(batchInsertQuery, {
            personalOwnerSlug: PERSONAL_OWNER_ROLE_SLUG,
            shareScope: 'workflow:share',
            unshareScope: 'workflow:unshare',
        });
        await runQuery(batchInsertQuery, {
            personalOwnerSlug: PERSONAL_OWNER_ROLE_SLUG,
            shareScope: 'credential:share',
            unshareScope: 'credential:unshare',
        });
    }
    async down({ escape, runQuery }) {
        const roleScopeTableName = escape.tableName('role_scope');
        const roleScopeScopeSlugColumn = escape.columnName('scopeSlug');
        const deleteQuery = `
			DELETE FROM ${roleScopeTableName}
			WHERE ${roleScopeScopeSlugColumn} = :unshareScope
		`;
        await runQuery(deleteQuery, { unshareScope: 'workflow:unshare' });
        await runQuery(deleteQuery, { unshareScope: 'credential:unshare' });
    }
}
exports.AddUnshareScopeToCustomRoles1771500000001 = AddUnshareScopeToCustomRoles1771500000001;
//# sourceMappingURL=1771500000001-AddUnshareScopeToCustomRoles.js.map