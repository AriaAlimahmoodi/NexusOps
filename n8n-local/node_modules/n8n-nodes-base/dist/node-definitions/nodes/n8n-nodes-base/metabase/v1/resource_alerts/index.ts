/**
 * Metabase - Alerts Resource
 * Re-exports all operation types for this resource.
 */

import type { MetabaseV1AlertsGetNode } from './operation_get';
import type { MetabaseV1AlertsGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type MetabaseV1AlertsNode =
  | MetabaseV1AlertsGetNode
  | MetabaseV1AlertsGetAllNode
  ;