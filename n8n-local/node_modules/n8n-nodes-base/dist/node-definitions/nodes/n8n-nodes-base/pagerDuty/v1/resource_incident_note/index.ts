/**
 * PagerDuty - IncidentNote Resource
 * Re-exports all operation types for this resource.
 */

import type { PagerDutyV1IncidentNoteCreateNode } from './operation_create';
import type { PagerDutyV1IncidentNoteGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type PagerDutyV1IncidentNoteNode =
  | PagerDutyV1IncidentNoteCreateNode
  | PagerDutyV1IncidentNoteGetAllNode
  ;