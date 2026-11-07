"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProjectIdToVariableTable1758794506893 = void 0;
const VARIABLES_TABLE_NAME = 'variables';
const VARIABLES_TEMP_TABLE_NAME = 'variables_temp';
const UNIQUE_PROJECT_KEY_INDEX_NAME = 'variables_project_key_unique';
const UNIQUE_GLOBAL_KEY_INDEX_NAME = 'variables_global_key_unique';
class AddProjectIdToVariableTable1758794506893 {
    async up({ schemaBuilder: { createTable, column, createIndex, dropTable }, queryRunner, escape, copyTable, }) {
        const variablesTableName = escape.tableName(VARIABLES_TABLE_NAME);
        const tempVariablesTableName = escape.tableName(VARIABLES_TEMP_TABLE_NAME);
        await createTable(VARIABLES_TEMP_TABLE_NAME)
            .withColumns(column('id').varchar(36).primary.notNull, column('key').text.notNull, column('type').text.notNull.default("'string'"), column('value').text, column('projectId').varchar(36))
            .withForeignKey('projectId', { tableName: 'project', columnName: 'id', onDelete: 'CASCADE' });
        await createIndex(VARIABLES_TEMP_TABLE_NAME, ['projectId', 'key'], true, UNIQUE_PROJECT_KEY_INDEX_NAME);
        await queryRunner.query(`CREATE UNIQUE INDEX "${UNIQUE_GLOBAL_KEY_INDEX_NAME}"
			 ON ${tempVariablesTableName} ("key")
			 WHERE projectId IS NULL`);
        await copyTable(VARIABLES_TABLE_NAME, VARIABLES_TEMP_TABLE_NAME, ['id', 'key', 'type', 'value'], ['id', 'key', 'type', 'value']);
        await dropTable(VARIABLES_TABLE_NAME);
        await queryRunner.query(`ALTER TABLE ${tempVariablesTableName} RENAME TO ${variablesTableName};`);
    }
    async down({ schemaBuilder: { createTable, column, createIndex, dropTable }, queryRunner, escape, }) {
        const variablesTableName = escape.tableName(VARIABLES_TABLE_NAME);
        const tempVariablesTableName = escape.tableName(VARIABLES_TEMP_TABLE_NAME);
        await createTable(VARIABLES_TEMP_TABLE_NAME).withColumns(column('id').varchar(36).primary.notNull, column('key').text.notNull, column('type').text.notNull.default("'string'"), column('value').text);
        await queryRunner.query(`INSERT INTO ${tempVariablesTableName} (id, "key", type, value) SELECT id, "key", type, value FROM ${variablesTableName} WHERE projectId IS NULL;`);
        await dropTable(VARIABLES_TABLE_NAME);
        await queryRunner.query(`ALTER TABLE ${tempVariablesTableName} RENAME TO ${variablesTableName};`);
        await createIndex(VARIABLES_TABLE_NAME, ['key'], true);
    }
}
exports.AddProjectIdToVariableTable1758794506893 = AddProjectIdToVariableTable1758794506893;
//# sourceMappingURL=1758794506893-AddProjectIdToVariableTable.js.map