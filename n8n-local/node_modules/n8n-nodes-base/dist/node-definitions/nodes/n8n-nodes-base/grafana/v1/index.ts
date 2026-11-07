/**
 * Grafana Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GrafanaV1DashboardNode } from './resource_dashboard';
import type { GrafanaV1TeamNode } from './resource_team';
import type { GrafanaV1TeamMemberNode } from './resource_team_member';
import type { GrafanaV1UserNode } from './resource_user';

export * from './resource_dashboard';
export * from './resource_team';
export * from './resource_team_member';
export * from './resource_user';

export type GrafanaV1Node =
  | GrafanaV1DashboardNode
  | GrafanaV1TeamNode
  | GrafanaV1TeamMemberNode
  | GrafanaV1UserNode
  ;