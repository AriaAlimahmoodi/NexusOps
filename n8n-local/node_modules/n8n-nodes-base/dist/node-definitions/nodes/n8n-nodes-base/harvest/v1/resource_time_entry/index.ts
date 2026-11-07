/**
 * Harvest - TimeEntry Resource
 * Re-exports all operation types for this resource.
 */

import type { HarvestV1TimeEntryCreateByDurationNode } from './operation_create_by_duration';
import type { HarvestV1TimeEntryCreateByStartEndNode } from './operation_create_by_start_end';
import type { HarvestV1TimeEntryDeleteNode } from './operation_delete';
import type { HarvestV1TimeEntryDeleteExternalNode } from './operation_delete_external';
import type { HarvestV1TimeEntryGetNode } from './operation_get';
import type { HarvestV1TimeEntryGetAllNode } from './operation_get_all';
import type { HarvestV1TimeEntryRestartTimeNode } from './operation_restart_time';
import type { HarvestV1TimeEntryStopTimeNode } from './operation_stop_time';
import type { HarvestV1TimeEntryUpdateNode } from './operation_update';

export * from './operation_create_by_duration';
export * from './operation_create_by_start_end';
export * from './operation_delete';
export * from './operation_delete_external';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_restart_time';
export * from './operation_stop_time';
export * from './operation_update';

export type HarvestV1TimeEntryNode =
  | HarvestV1TimeEntryCreateByDurationNode
  | HarvestV1TimeEntryCreateByStartEndNode
  | HarvestV1TimeEntryDeleteNode
  | HarvestV1TimeEntryDeleteExternalNode
  | HarvestV1TimeEntryGetNode
  | HarvestV1TimeEntryGetAllNode
  | HarvestV1TimeEntryRestartTimeNode
  | HarvestV1TimeEntryStopTimeNode
  | HarvestV1TimeEntryUpdateNode
  ;