"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkflowVersionColumn1761047826451 = void 0;
class AddWorkflowVersionColumn1761047826451 {
    async up({ queryRunner, tablePrefix }) {
        const tableName = `${tablePrefix}workflow_entity`;
        const triggerName = `${tablePrefix}workflow_version_increment`;
        await queryRunner.query(`ALTER TABLE ${tableName} ADD COLUMN "versionCounter" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`
			CREATE TRIGGER ${triggerName}
			AFTER UPDATE ON ${tableName}
			FOR EACH ROW
			WHEN OLD."versionCounter" = NEW."versionCounter"
			BEGIN
				UPDATE ${tableName}
				SET "versionCounter" = "versionCounter" + 1
				WHERE id = NEW.id;
			END;
		`);
    }
    async down({ queryRunner, tablePrefix }) {
        const tableName = `${tablePrefix}workflow_entity`;
        const triggerName = `${tablePrefix}workflow_version_increment`;
        await queryRunner.query(`DROP TRIGGER IF EXISTS ${triggerName}`);
        await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN "versionCounter"`);
    }
}
exports.AddWorkflowVersionColumn1761047826451 = AddWorkflowVersionColumn1761047826451;
//# sourceMappingURL=1761047826451-AddWorkflowVersionColumn.js.map