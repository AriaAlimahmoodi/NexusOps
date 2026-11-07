/**
 * Cortex - Job Resource
 * Re-exports all operation types for this resource.
 */

import type { CortexV1JobGetNode } from './operation_get';
import type { CortexV1JobReportNode } from './operation_report';

export * from './operation_get';
export * from './operation_report';

export type CortexV1JobNode =
  | CortexV1JobGetNode
  | CortexV1JobReportNode
  ;