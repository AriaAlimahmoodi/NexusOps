/**
 * UptimeRobot - MaintenanceWindow Resource
 * Re-exports all operation types for this resource.
 */

import type { UptimeRobotV1MaintenanceWindowCreateNode } from './operation_create';
import type { UptimeRobotV1MaintenanceWindowDeleteNode } from './operation_delete';
import type { UptimeRobotV1MaintenanceWindowGetNode } from './operation_get';
import type { UptimeRobotV1MaintenanceWindowGetAllNode } from './operation_get_all';
import type { UptimeRobotV1MaintenanceWindowUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type UptimeRobotV1MaintenanceWindowNode =
  | UptimeRobotV1MaintenanceWindowCreateNode
  | UptimeRobotV1MaintenanceWindowDeleteNode
  | UptimeRobotV1MaintenanceWindowGetNode
  | UptimeRobotV1MaintenanceWindowGetAllNode
  | UptimeRobotV1MaintenanceWindowUpdateNode
  ;