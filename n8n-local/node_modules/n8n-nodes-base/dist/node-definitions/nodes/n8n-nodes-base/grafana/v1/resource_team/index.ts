/**
 * Grafana - Team Resource
 * Re-exports all operation types for this resource.
 */

import type { GrafanaV1TeamCreateNode } from './operation_create';
import type { GrafanaV1TeamDeleteNode } from './operation_delete';
import type { GrafanaV1TeamGetNode } from './operation_get';
import type { GrafanaV1TeamGetAllNode } from './operation_get_all';
import type { GrafanaV1TeamUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GrafanaV1TeamNode =
  | GrafanaV1TeamCreateNode
  | GrafanaV1TeamDeleteNode
  | GrafanaV1TeamGetNode
  | GrafanaV1TeamGetAllNode
  | GrafanaV1TeamUpdateNode
  ;