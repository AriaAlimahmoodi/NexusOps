/**
 * Splunk - Report Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV2ReportCreateNode } from './operation_create';
import type { SplunkV2ReportDeleteReportNode } from './operation_delete_report';
import type { SplunkV2ReportGetNode } from './operation_get';
import type { SplunkV2ReportGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete_report';
export * from './operation_get';
export * from './operation_get_all';

export type SplunkV2ReportNode =
  | SplunkV2ReportCreateNode
  | SplunkV2ReportDeleteReportNode
  | SplunkV2ReportGetNode
  | SplunkV2ReportGetAllNode
  ;