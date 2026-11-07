"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkRoleToProjectRelationTable1753953244168 = void 0;
const constants_1 = require("../../constants");
class LinkRoleToProjectRelationTable1753953244168 {
    async up({ schemaBuilder: { addForeignKey }, escape, dbType, runQuery }) {
        const roleTableName = escape.tableName('role');
        const projectRelationTableName = escape.tableName('project_relation');
        const slugColumn = escape.columnName('slug');
        const roleColumn = escape.columnName('role');
        const roleTypeColumn = escape.columnName('roleType');
        const systemRoleColumn = escape.columnName('systemRole');
        const isPostgresOrSqlite = dbType === 'postgresdb' || dbType === 'sqlite';
        const query = isPostgresOrSqlite
            ? `INSERT INTO ${roleTableName} (${slugColumn}, ${roleTypeColumn}, ${systemRoleColumn}) VALUES (:slug, :roleType, :systemRole) ON CONFLICT DO NOTHING`
            : `INSERT IGNORE INTO ${roleTableName} (${slugColumn}, ${roleTypeColumn}, ${systemRoleColumn}) VALUES (:slug, :roleType, :systemRole)`;
        for (const role of Object.values(constants_1.PROJECT_ROLES)) {
            await runQuery(query, {
                slug: role.slug,
                roleType: role.roleType,
                systemRole: role.systemRole,
            });
        }
        await runQuery(`UPDATE ${projectRelationTableName} SET ${roleColumn} = '${constants_1.PROJECT_VIEWER_ROLE.slug}' WHERE NOT EXISTS (SELECT 1 FROM ${roleTableName} WHERE ${slugColumn} = ${roleColumn})`);
        await addForeignKey('project_relation', 'role', ['role', 'slug']);
    }
    async down({ schemaBuilder: { dropForeignKey } }) {
        await dropForeignKey('project_relation', 'role', ['role', 'slug']);
    }
}
exports.LinkRoleToProjectRelationTable1753953244168 = LinkRoleToProjectRelationTable1753953244168;
//# sourceMappingURL=1753953244168-LinkRoleToProjectRelationTable.js.map