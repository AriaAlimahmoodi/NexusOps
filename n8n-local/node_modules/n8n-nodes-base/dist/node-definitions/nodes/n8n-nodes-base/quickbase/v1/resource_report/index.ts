/**
 * Quick Base - Report Resource
 * Re-exports all operation types for this resource.
 */

import type { QuickbaseV1ReportGetNode } from './operation_get';
import type { QuickbaseV1ReportRunNode } from './operation_run';

export * from './operation_get';
export * from './operation_run';

export type QuickbaseV1ReportNode =
  | QuickbaseV1ReportGetNode
  | QuickbaseV1ReportRunNode
  ;