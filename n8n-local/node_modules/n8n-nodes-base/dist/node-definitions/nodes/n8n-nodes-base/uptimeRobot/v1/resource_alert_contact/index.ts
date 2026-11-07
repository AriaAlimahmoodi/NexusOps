/**
 * UptimeRobot - AlertContact Resource
 * Re-exports all operation types for this resource.
 */

import type { UptimeRobotV1AlertContactCreateNode } from './operation_create';
import type { UptimeRobotV1AlertContactDeleteNode } from './operation_delete';
import type { UptimeRobotV1AlertContactGetNode } from './operation_get';
import type { UptimeRobotV1AlertContactGetAllNode } from './operation_get_all';
import type { UptimeRobotV1AlertContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type UptimeRobotV1AlertContactNode =
  | UptimeRobotV1AlertContactCreateNode
  | UptimeRobotV1AlertContactDeleteNode
  | UptimeRobotV1AlertContactGetNode
  | UptimeRobotV1AlertContactGetAllNode
  | UptimeRobotV1AlertContactUpdateNode
  ;