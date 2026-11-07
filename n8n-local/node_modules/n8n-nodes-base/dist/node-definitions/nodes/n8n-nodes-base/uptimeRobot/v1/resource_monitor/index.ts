/**
 * UptimeRobot - Monitor Resource
 * Re-exports all operation types for this resource.
 */

import type { UptimeRobotV1MonitorCreateNode } from './operation_create';
import type { UptimeRobotV1MonitorDeleteNode } from './operation_delete';
import type { UptimeRobotV1MonitorGetNode } from './operation_get';
import type { UptimeRobotV1MonitorGetAllNode } from './operation_get_all';
import type { UptimeRobotV1MonitorResetNode } from './operation_reset';
import type { UptimeRobotV1MonitorUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_reset';
export * from './operation_update';

export type UptimeRobotV1MonitorNode =
  | UptimeRobotV1MonitorCreateNode
  | UptimeRobotV1MonitorDeleteNode
  | UptimeRobotV1MonitorGetNode
  | UptimeRobotV1MonitorGetAllNode
  | UptimeRobotV1MonitorResetNode
  | UptimeRobotV1MonitorUpdateNode
  ;