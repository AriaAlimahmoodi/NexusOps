"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeWorkflowStatisticsFKToNoAction1767018516000 = void 0;
class ChangeWorkflowStatisticsFKToNoAction1767018516000 {
    constructor() {
        this.withFKsDisabled = true;
    }
    async up({ queryRunner, tablePrefix }) {
        await queryRunner.query(`
			CREATE TABLE "${tablePrefix}TMP_workflow_statistics" (
				"id" INTEGER PRIMARY KEY AUTOINCREMENT,
				"count" INTEGER DEFAULT 0,
				"latestEvent" DATETIME,
				"name" VARCHAR(128) NOT NULL,
				"workflowId" VARCHAR(36) NOT NULL,
				"workflowName" VARCHAR(128),
				"rootCount" INTEGER DEFAULT 0
			)
		`);
        await queryRunner.query(`
			INSERT INTO "${tablePrefix}TMP_workflow_statistics" ("count", "latestEvent", "name", "workflowId", "workflowName", "rootCount")
			SELECT ws."count", ws."latestEvent", ws."name", ws."workflowId", we."name", ws."rootCount"
			FROM "${tablePrefix}workflow_statistics" ws
			LEFT JOIN "${tablePrefix}workflow_entity" we ON ws."workflowId" = we."id"
			WHERE ws."workflowId" IS NOT NULL
		`);
        await queryRunner.query(`DROP TABLE "${tablePrefix}workflow_statistics"`);
        await queryRunner.query(`ALTER TABLE "${tablePrefix}TMP_workflow_statistics" RENAME TO "${tablePrefix}workflow_statistics"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_${tablePrefix}workflow_statistics_workflow_name" ON "${tablePrefix}workflow_statistics" ("workflowId", "name")`);
    }
    async down({ queryRunner, tablePrefix }) {
        await queryRunner.query(`
			CREATE TABLE "${tablePrefix}TMP_workflow_statistics" (
				"count" INTEGER DEFAULT 0,
				"latestEvent" DATETIME,
				"name" VARCHAR(128) NOT NULL,
				"workflowId" VARCHAR(36) NOT NULL,
				"rootCount" INTEGER DEFAULT 0,
				PRIMARY KEY("workflowId", "name"),
				FOREIGN KEY("workflowId") REFERENCES "${tablePrefix}workflow_entity"("id") ON DELETE CASCADE
			)
		`);
        await queryRunner.query(`
			DELETE FROM "${tablePrefix}workflow_statistics"
			WHERE "workflowId" NOT IN (SELECT "id" FROM "${tablePrefix}workflow_entity")
		`);
        await queryRunner.query(`
			INSERT INTO "${tablePrefix}TMP_workflow_statistics" ("count", "latestEvent", "name", "workflowId", "rootCount")
			SELECT
				"count",
				"latestEvent",
				"name",
				"workflowId",
				"rootCount"
			FROM "${tablePrefix}workflow_statistics"
		`);
        await queryRunner.query(`DROP TABLE "${tablePrefix}workflow_statistics"`);
        await queryRunner.query(`ALTER TABLE "${tablePrefix}TMP_workflow_statistics" RENAME TO "${tablePrefix}workflow_statistics"`);
    }
}
exports.ChangeWorkflowStatisticsFKToNoAction1767018516000 = ChangeWorkflowStatisticsFKToNoAction1767018516000;
//# sourceMappingURL=1767018516000-ChangeWorkflowStatisticsFKToNoAction.js.map