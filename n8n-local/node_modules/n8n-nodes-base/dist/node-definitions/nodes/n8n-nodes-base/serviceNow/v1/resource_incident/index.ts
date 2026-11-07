/**
 * ServiceNow - Incident Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1IncidentCreateNode } from './operation_create';
import type { ServiceNowV1IncidentDeleteNode } from './operation_delete';
import type { ServiceNowV1IncidentGetNode } from './operation_get';
import type { ServiceNowV1IncidentGetAllNode } from './operation_get_all';
import type { ServiceNowV1IncidentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ServiceNowV1IncidentNode =
  | ServiceNowV1IncidentCreateNode
  | ServiceNowV1IncidentDeleteNode
  | ServiceNowV1IncidentGetNode
  | ServiceNowV1IncidentGetAllNode
  | ServiceNowV1IncidentUpdateNode
  ;