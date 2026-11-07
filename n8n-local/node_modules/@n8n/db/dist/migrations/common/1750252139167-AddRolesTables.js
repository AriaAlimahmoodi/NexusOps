"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRolesTables1750252139167 = void 0;
class AddRolesTables1750252139167 {
    async up({ schemaBuilder: { createTable, column, createIndex }, queryRunner, tablePrefix, }) {
        await createTable('role').withColumns(column('slug')
            .varchar(128)
            .primary.notNull.comment('Unique identifier of the role for example: "global:owner"'), column('displayName').text.default(null).comment('Name used to display in the UI'), column('description')
            .text.default(null)
            .comment('Text describing the scope in more detail of users'), column('roleType')
            .text.default(null)
            .comment('Type of the role, e.g., global, project, or workflow'), column('systemRole')
            .bool.default(false)
            .notNull.comment('Indicates if the role is managed by the system and cannot be edited'));
        await queryRunner.query(`CREATE TABLE ${tablePrefix}role_scope (
					"roleSlug" VARCHAR(128) NOT NULL,
					"scopeSlug" VARCHAR(128) NOT NULL,
					CONSTRAINT "PK_${tablePrefix}role_scope" PRIMARY KEY ("roleSlug", "scopeSlug"),
					CONSTRAINT "FK_${tablePrefix}role" FOREIGN KEY ("roleSlug") REFERENCES ${tablePrefix}role ("slug") ON DELETE CASCADE ON UPDATE CASCADE,
					CONSTRAINT "FK_${tablePrefix}scope" FOREIGN KEY ("scopeSlug") REFERENCES "${tablePrefix}scope" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
				);`);
        await createIndex('role_scope', ['scopeSlug']);
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable('role_scope');
        await dropTable('role');
    }
}
exports.AddRolesTables1750252139167 = AddRolesTables1750252139167;
//# sourceMappingURL=1750252139167-AddRolesTables.js.map