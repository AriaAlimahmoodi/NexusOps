"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBinaryDataTable1763716655000 = void 0;
const tableName = 'binary_data';
class CreateBinaryDataTable1763716655000 {
    async up({ schemaBuilder: { createTable, column } }) {
        await createTable(tableName)
            .withColumns(column('fileId').uuid.primary.notNull, column('sourceType')
            .varchar(50)
            .notNull.withEnumCheck(['execution', 'chat_message_attachment'])
            .comment("Source the file belongs to, e.g. 'execution'"), column('sourceId').varchar(255).notNull.comment('ID of the source, e.g. execution ID'), column('data').binary.notNull.comment('Raw, not base64 encoded'), column('mimeType').varchar(255), column('fileName').varchar(255), column('fileSize').int.notNull.comment('In bytes'))
            .withIndexOn(['sourceType', 'sourceId']).withTimestamps;
    }
    async down({ schemaBuilder: { dropTable } }) {
        await dropTable(tableName);
    }
}
exports.CreateBinaryDataTable1763716655000 = CreateBinaryDataTable1763716655000;
//# sourceMappingURL=1763716655000-CreateBinaryDataTable.js.map