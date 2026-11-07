/**
 * SecurityScorecard - Report Resource
 * Re-exports all operation types for this resource.
 */

import type { SecurityScorecardV1ReportDownloadNode } from './operation_download';
import type { SecurityScorecardV1ReportGenerateNode } from './operation_generate';
import type { SecurityScorecardV1ReportGetAllNode } from './operation_get_all';

export * from './operation_download';
export * from './operation_generate';
export * from './operation_get_all';

export type SecurityScorecardV1ReportNode =
  | SecurityScorecardV1ReportDownloadNode
  | SecurityScorecardV1ReportGenerateNode
  | SecurityScorecardV1ReportGetAllNode
  ;