/**
 * UptimeRobot - PublicStatusPage Resource
 * Re-exports all operation types for this resource.
 */

import type { UptimeRobotV1PublicStatusPageCreateNode } from './operation_create';
import type { UptimeRobotV1PublicStatusPageDeleteNode } from './operation_delete';
import type { UptimeRobotV1PublicStatusPageGetNode } from './operation_get';
import type { UptimeRobotV1PublicStatusPageGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type UptimeRobotV1PublicStatusPageNode =
  | UptimeRobotV1PublicStatusPageCreateNode
  | UptimeRobotV1PublicStatusPageDeleteNode
  | UptimeRobotV1PublicStatusPageGetNode
  | UptimeRobotV1PublicStatusPageGetAllNode
  ;