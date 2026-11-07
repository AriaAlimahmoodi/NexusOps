"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpandModelColumnLength1768402473068 = void 0;
class ExpandModelColumnLength1768402473068 {
    async up({ isSqlite, isPostgres, escape, queryRunner }) {
        const messagesTable = escape.tableName('chat_hub_messages');
        const sessionsTable = escape.tableName('chat_hub_sessions');
        const modelColumn = escape.columnName('model');
        if (isPostgres) {
            await queryRunner.query(`ALTER TABLE ${messagesTable} ALTER COLUMN ${modelColumn} TYPE VARCHAR(256);`);
            await queryRunner.query(`ALTER TABLE ${sessionsTable} ALTER COLUMN ${modelColumn} TYPE VARCHAR(256);`);
        }
        else if (isSqlite) {
            for (const table of [messagesTable, sessionsTable]) {
                await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN "model_tmp" VARCHAR(256);`);
                await queryRunner.query(`UPDATE ${table} SET "model_tmp" = ${modelColumn};`);
                await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN ${modelColumn};`);
                await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN ${modelColumn} VARCHAR(256);`);
                await queryRunner.query(`UPDATE ${table} SET ${modelColumn} = "model_tmp";`);
                await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN "model_tmp";`);
            }
        }
    }
    async down({ isSqlite, isPostgres, escape, queryRunner }) {
        const messagesTable = escape.tableName('chat_hub_messages');
        const sessionsTable = escape.tableName('chat_hub_sessions');
        const modelColumn = escape.columnName('model');
        if (isPostgres) {
            await queryRunner.query(`UPDATE ${messagesTable} SET ${modelColumn} = LEFT(${modelColumn}, 64) WHERE LENGTH(${modelColumn}) > 64;`);
            await queryRunner.query(`UPDATE ${sessionsTable} SET ${modelColumn} = LEFT(${modelColumn}, 64) WHERE LENGTH(${modelColumn}) > 64;`);
            await queryRunner.query(`ALTER TABLE ${messagesTable} ALTER COLUMN ${modelColumn} TYPE VARCHAR(64);`);
            await queryRunner.query(`ALTER TABLE ${sessionsTable} ALTER COLUMN ${modelColumn} TYPE VARCHAR(64);`);
        }
        else if (isSqlite) {
            for (const table of [messagesTable, sessionsTable]) {
                await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN "model_tmp" VARCHAR(64);`);
                await queryRunner.query(`UPDATE ${table} SET "model_tmp" = SUBSTR(${modelColumn}, 1, 64);`);
                await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN ${modelColumn};`);
                await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN ${modelColumn} VARCHAR(64);`);
                await queryRunner.query(`UPDATE ${table} SET ${modelColumn} = "model_tmp";`);
                await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN "model_tmp";`);
            }
        }
    }
}
exports.ExpandModelColumnLength1768402473068 = ExpandModelColumnLength1768402473068;
//# sourceMappingURL=1768402473068-ExpandModelColumnLength.js.map