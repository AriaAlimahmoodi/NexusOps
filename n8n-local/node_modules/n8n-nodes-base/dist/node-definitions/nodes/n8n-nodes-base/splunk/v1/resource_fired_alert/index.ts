/**
 * Splunk - FiredAlert Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV1FiredAlertGetReportNode } from './operation_get_report';

export * from './operation_get_report';

export type SplunkV1FiredAlertNode = SplunkV1FiredAlertGetReportNode;