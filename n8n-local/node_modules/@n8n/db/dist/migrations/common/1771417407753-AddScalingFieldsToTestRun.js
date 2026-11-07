"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddScalingFieldsToTestRun1771417407753 = void 0;
class AddScalingFieldsToTestRun1771417407753 {
    async up({ escape, runQuery }) {
        const tableName = escape.tableName('test_run');
        const runningInstanceIdColumnName = escape.columnName('runningInstanceId');
        const cancelRequestedColumnName = escape.columnName('cancelRequested');
        await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${runningInstanceIdColumnName} VARCHAR(255);`);
        await runQuery(`ALTER TABLE ${tableName} ADD COLUMN ${cancelRequestedColumnName} BOOLEAN NOT NULL DEFAULT FALSE;`);
    }
    async down({ escape, runQuery }) {
        const tableName = escape.tableName('test_run');
        const runningInstanceIdColumnName = escape.columnName('runningInstanceId');
        const cancelRequestedColumnName = escape.columnName('cancelRequested');
        await runQuery(`ALTER TABLE ${tableName} DROP COLUMN ${runningInstanceIdColumnName};`);
        await runQuery(`ALTER TABLE ${tableName} DROP COLUMN ${cancelRequestedColumnName};`);
    }
}
exports.AddScalingFieldsToTestRun1771417407753 = AddScalingFieldsToTestRun1771417407753;
//# sourceMappingURL=1771417407753-AddScalingFieldsToTestRun.js.map