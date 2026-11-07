"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkflowPublishScopeToProjectRoles1766064542000 = void 0;
class AddWorkflowPublishScopeToProjectRoles1766064542000 {
    async up({ escape, runQuery, logger }) {
        const scopeTableName = escape.tableName('scope');
        const scopeSlugColumn = escape.columnName('slug');
        const displayNameColumn = escape.columnName('displayName');
        const descriptionColumn = escape.columnName('description');
        const roleTableName = escape.tableName('role');
        const roleScopeTableName = escape.tableName('role_scope');
        const roleSlugColumn = escape.columnName('slug');
        const roleTypeColumn = escape.columnName('roleType');
        const roleScopeRoleSlugColumn = escape.columnName('roleSlug');
        const roleScopeScopeSlugColumn = escape.columnName('scopeSlug');
        const insertScopeQuery = `INSERT INTO ${scopeTableName} (${scopeSlugColumn}, ${displayNameColumn}, ${descriptionColumn})
         VALUES (:slug, :displayName, :description)
         ON CONFLICT (${scopeSlugColumn}) DO NOTHING`;
        await runQuery(insertScopeQuery, {
            slug: 'workflow:publish',
            displayName: 'Publish Workflow',
            description: 'Allows publishing and unpublishing workflows.',
        });
        logger.debug('Ensured workflow:publish scope exists');
        const batchInsertQuery = `
		INSERT INTO ${roleScopeTableName} (${roleScopeRoleSlugColumn}, ${roleScopeScopeSlugColumn})
		SELECT DISTINCT role.${roleSlugColumn}, :publishScope
		FROM ${roleTableName} role
		INNER JOIN ${roleScopeTableName} role_scope
			ON role.${roleSlugColumn} = role_scope.${roleScopeRoleSlugColumn}
		WHERE role.${roleTypeColumn} = :roleType
			AND role_scope.${roleScopeScopeSlugColumn} = :updateScope
		ON CONFLICT (${roleScopeRoleSlugColumn}, ${roleScopeScopeSlugColumn}) DO NOTHING
	`;
        await runQuery(batchInsertQuery, {
            roleType: 'project',
            updateScope: 'workflow:update',
            publishScope: 'workflow:publish',
        });
        logger.info('Added workflow:publish scope to project roles with workflow:update');
    }
    async down({ escape, runQuery, logger }) {
        const roleScopeTableName = escape.tableName('role_scope');
        const roleScopeScopeSlugColumn = escape.columnName('scopeSlug');
        const deleteQuery = `
			DELETE FROM ${roleScopeTableName}
			WHERE ${roleScopeScopeSlugColumn} = :publishScope
		`;
        await runQuery(deleteQuery, {
            publishScope: 'workflow:publish',
        });
        logger.info('Removed workflow:publish scope from all roles');
    }
}
exports.AddWorkflowPublishScopeToProjectRoles1766064542000 = AddWorkflowPublishScopeToProjectRoles1766064542000;
//# sourceMappingURL=1766064542000-AddWorkflowPublishScopeToProjectRoles.js.map