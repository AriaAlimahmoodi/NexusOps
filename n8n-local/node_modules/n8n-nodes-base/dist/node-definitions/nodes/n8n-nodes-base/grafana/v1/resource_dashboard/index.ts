/**
 * Grafana - Dashboard Resource
 * Re-exports all operation types for this resource.
 */

import type { GrafanaV1DashboardCreateNode } from './operation_create';
import type { GrafanaV1DashboardDeleteNode } from './operation_delete';
import type { GrafanaV1DashboardGetNode } from './operation_get';
import type { GrafanaV1DashboardGetAllNode } from './operation_get_all';
import type { GrafanaV1DashboardUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GrafanaV1DashboardNode =
  | GrafanaV1DashboardCreateNode
  | GrafanaV1DashboardDeleteNode
  | GrafanaV1DashboardGetNode
  | GrafanaV1DashboardGetAllNode
  | GrafanaV1DashboardUpdateNode
  ;