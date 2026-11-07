/**
 * Grafana - User Resource
 * Re-exports all operation types for this resource.
 */

import type { GrafanaV1UserDeleteNode } from './operation_delete';
import type { GrafanaV1UserGetAllNode } from './operation_get_all';
import type { GrafanaV1UserUpdateNode } from './operation_update';

export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type GrafanaV1UserNode =
  | GrafanaV1UserDeleteNode
  | GrafanaV1UserGetAllNode
  | GrafanaV1UserUpdateNode
  ;