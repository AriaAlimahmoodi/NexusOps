/**
 * UptimeRobot Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { UptimeRobotV1AccountNode } from './resource_account';
import type { UptimeRobotV1AlertContactNode } from './resource_alert_contact';
import type { UptimeRobotV1MaintenanceWindowNode } from './resource_maintenance_window';
import type { UptimeRobotV1MonitorNode } from './resource_monitor';
import type { UptimeRobotV1PublicStatusPageNode } from './resource_public_status_page';

export * from './resource_account';
export * from './resource_alert_contact';
export * from './resource_maintenance_window';
export * from './resource_monitor';
export * from './resource_public_status_page';

export type UptimeRobotV1Node =
  | UptimeRobotV1AccountNode
  | UptimeRobotV1AlertContactNode
  | UptimeRobotV1MaintenanceWindowNode
  | UptimeRobotV1MonitorNode
  | UptimeRobotV1PublicStatusPageNode
  ;