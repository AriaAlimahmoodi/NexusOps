/**
 * PagerDuty - LogEntry Resource
 * Re-exports all operation types for this resource.
 */

import type { PagerDutyV1LogEntryGetNode } from './operation_get';
import type { PagerDutyV1LogEntryGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type PagerDutyV1LogEntryNode =
  | PagerDutyV1LogEntryGetNode
  | PagerDutyV1LogEntryGetAllNode
  ;