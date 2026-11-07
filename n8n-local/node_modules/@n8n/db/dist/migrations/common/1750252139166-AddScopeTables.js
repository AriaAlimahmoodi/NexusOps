"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddScopeTables1750252139166 = void 0;
class AddScopeTables1750252139166 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable('scope').withColumns(column('slug')
            .varchar(128)
            .primary.notNull.comment('Unique identifier of the scope for example: "project:create"'), column('displayName').text.default(null).comment('Name used to display in the UI'), column('description')
            .text.default(null)
            .comment('Text describing the scope in more detail of users'));
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable('scope');
    }
}
exports.AddScopeTables1750252139166 = AddScopeTables1750252139166;
//# sourceMappingURL=1750252139166-AddScopeTables.js.map