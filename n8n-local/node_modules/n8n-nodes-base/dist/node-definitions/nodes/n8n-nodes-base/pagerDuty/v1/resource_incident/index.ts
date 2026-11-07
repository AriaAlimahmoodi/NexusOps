/**
 * PagerDuty - Incident Resource
 * Re-exports all operation types for this resource.
 */

import type { PagerDutyV1IncidentCreateNode } from './operation_create';
import type { PagerDutyV1IncidentGetNode } from './operation_get';
import type { PagerDutyV1IncidentGetAllNode } from './operation_get_all';
import type { PagerDutyV1IncidentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type PagerDutyV1IncidentNode =
  | PagerDutyV1IncidentCreateNode
  | PagerDutyV1IncidentGetNode
  | PagerDutyV1IncidentGetAllNode
  | PagerDutyV1IncidentUpdateNode
  ;