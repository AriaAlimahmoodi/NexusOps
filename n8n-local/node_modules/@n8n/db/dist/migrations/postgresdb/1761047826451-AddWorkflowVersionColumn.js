"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkflowVersionColumn1761047826451 = void 0;
class AddWorkflowVersionColumn1761047826451 {
    async up({ queryRunner, tablePrefix }) {
        const tableName = `${tablePrefix}workflow_entity`;
        const triggerName = `${tablePrefix}workflow_version_increment`;
        const functionName = `${tablePrefix}increment_workflow_version`;
        await queryRunner.query(`ALTER TABLE ${tableName} ADD COLUMN "versionCounter" integer NOT NULL DEFAULT 1`);
        await queryRunner.query(`
			CREATE OR REPLACE FUNCTION ${functionName}()
			RETURNS TRIGGER AS $$
			BEGIN
				IF NEW."versionCounter" IS NOT DISTINCT FROM OLD."versionCounter" THEN
					NEW."versionCounter" = OLD."versionCounter" + 1;
				END IF;
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql;
		`);
        await queryRunner.query(`
			CREATE TRIGGER ${triggerName}
			BEFORE UPDATE ON ${tableName}
			FOR EACH ROW
			EXECUTE FUNCTION ${functionName}();
		`);
    }
    async down({ queryRunner, tablePrefix }) {
        const tableName = `${tablePrefix}workflow_entity`;
        const triggerName = `${tablePrefix}workflow_version_increment`;
        const functionName = `${tablePrefix}increment_workflow_version`;
        await queryRunner.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName}`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS ${functionName}`);
        await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN "versionCounter"`);
    }
}
exports.AddWorkflowVersionColumn1761047826451 = AddWorkflowVersionColumn1761047826451;
//# sourceMappingURL=1761047826451-AddWorkflowVersionColumn.js.map