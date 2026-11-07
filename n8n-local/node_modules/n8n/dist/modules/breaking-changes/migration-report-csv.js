"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMigrationReportCsv = toMigrationReportCsv;
exports.migrationReportCsvFilename = migrationReportCsvFilename;
const COLUMNS = [
    'target_version',
    'current_version',
    'synced_at',
    'total_workflows',
    'affected_workflows',
    'affected_instance_rules',
    'rule_kind',
    'rule_id',
    'rule_title',
    'impact',
    'unresolved_workflows',
    'wont_fix_workflows',
];
function toCsvField(value) {
    if (value === undefined)
        return '';
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function toCsvLine(values) {
    return values.map(toCsvField).join(',');
}
function toMigrationReportCsv(result) {
    const { report } = result;
    const totals = [
        report.targetVersion,
        report.currentVersion,
        report.generatedAt ? new Date(report.generatedAt).toISOString() : undefined,
        result.totalWorkflows,
        result.totalAffectedWorkflows,
        report.instanceResults.length,
    ];
    const ruleRows = [
        ...report.workflowResults.map((rule) => [
            ...totals,
            'workflow',
            rule.ruleId,
            rule.ruleTitle,
            rule.ruleImpact,
            rule.nbAffectedWorkflows,
            rule.nbWontFixWorkflows,
        ]),
        ...report.instanceResults.map((rule) => [
            ...totals,
            'instance',
            rule.ruleId,
            rule.ruleTitle,
            rule.ruleImpact,
            undefined,
            undefined,
        ]),
    ];
    const emptyRuleColumns = new Array(COLUMNS.length - totals.length).fill(undefined);
    const rows = ruleRows.length > 0 ? ruleRows : [[...totals, ...emptyRuleColumns]];
    return [COLUMNS, ...rows].map(toCsvLine).join('\r\n') + '\r\n';
}
function migrationReportCsvFilename(targetVersion, now) {
    const day = now.toISOString().slice(0, 10);
    return `migration-report-${targetVersion}-${day}.csv`;
}
//# sourceMappingURL=migration-report-csv.js.map