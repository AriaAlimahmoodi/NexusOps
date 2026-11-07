"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeWorkflowStatisticsFKToNoAction1767018516000 = void 0;
class ChangeWorkflowStatisticsFKToNoAction1767018516000 {
    async up({ queryRunner, tablePrefix }) {
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics DROP CONSTRAINT IF EXISTS "fk_${tablePrefix}workflow_statistics_workflow_id"`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics DROP CONSTRAINT IF EXISTS "pk_${tablePrefix}workflow_statistics"`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ADD COLUMN "id" SERIAL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ADD COLUMN "workflowName" VARCHAR(128)`);
        await queryRunner.query(`UPDATE ${tablePrefix}workflow_statistics ws SET "workflowName" = we."name" FROM ${tablePrefix}workflow_entity we WHERE ws."workflowId" = we."id"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_${tablePrefix}workflow_statistics_workflow_name" ON ${tablePrefix}workflow_statistics ("workflowId", "name")`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ALTER COLUMN "count" TYPE BIGINT`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ALTER COLUMN "rootCount" TYPE BIGINT`);
    }
    async down({ queryRunner, tablePrefix }) {
        await queryRunner.query(`UPDATE ${tablePrefix}workflow_statistics SET "count" = 0 WHERE "count" > 2147483647`);
        await queryRunner.query(`UPDATE ${tablePrefix}workflow_statistics SET "rootCount" = 0 WHERE "rootCount" > 2147483647`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ALTER COLUMN "count" TYPE INTEGER`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ALTER COLUMN "rootCount" TYPE INTEGER`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${tablePrefix}workflow_statistics_workflow_name"`);
        await queryRunner.query(`DELETE FROM ${tablePrefix}workflow_statistics WHERE "workflowId" NOT IN (SELECT "id" FROM ${tablePrefix}workflow_entity)`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics DROP COLUMN "workflowName"`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ADD PRIMARY KEY ("workflowId", "name")`);
        await queryRunner.query(`ALTER TABLE ${tablePrefix}workflow_statistics ADD CONSTRAINT "fk_${tablePrefix}workflow_statistics_workflow_id" FOREIGN KEY ("workflowId") REFERENCES ${tablePrefix}workflow_entity(id) ON DELETE CASCADE`);
    }
}
exports.ChangeWorkflowStatisticsFKToNoAction1767018516000 = ChangeWorkflowStatisticsFKToNoAction1767018516000;
//# sourceMappingURL=1767018516000-ChangeWorkflowStatisticsFKToNoAction.js.map