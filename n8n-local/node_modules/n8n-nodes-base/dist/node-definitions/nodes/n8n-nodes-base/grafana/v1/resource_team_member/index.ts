/**
 * Grafana - TeamMember Resource
 * Re-exports all operation types for this resource.
 */

import type { GrafanaV1TeamMemberAddNode } from './operation_add';
import type { GrafanaV1TeamMemberGetAllNode } from './operation_get_all';
import type { GrafanaV1TeamMemberRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_get_all';
export * from './operation_remove';

export type GrafanaV1TeamMemberNode =
  | GrafanaV1TeamMemberAddNode
  | GrafanaV1TeamMemberGetAllNode
  | GrafanaV1TeamMemberRemoveNode
  ;