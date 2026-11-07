/**
 * Splunk - Alert Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV2AlertGetMetricsNode } from './operation_get_metrics';
import type { SplunkV2AlertGetReportNode } from './operation_get_report';

export * from './operation_get_metrics';
export * from './operation_get_report';

export type SplunkV2AlertNode =
  | SplunkV2AlertGetMetricsNode
  | SplunkV2AlertGetReportNode
  ;