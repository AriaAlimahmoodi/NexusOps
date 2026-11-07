import type { BreakingChangeLightReportResult, BreakingChangeVersion } from '@n8n/api-types';
export declare function toMigrationReportCsv(result: BreakingChangeLightReportResult): string;
export declare function migrationReportCsvFilename(targetVersion: BreakingChangeVersion, now: Date): string;
