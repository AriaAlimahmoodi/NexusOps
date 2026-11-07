/**
 * Currents - Project Resource
 * Re-exports all operation types for this resource.
 */

import type { CurrentsV1ProjectGetNode } from './operation_get';
import type { CurrentsV1ProjectGetAllNode } from './operation_get_all';
import type { CurrentsV1ProjectGetInsightsNode } from './operation_get_insights';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_insights';

export type CurrentsV1ProjectNode =
  | CurrentsV1ProjectGetNode
  | CurrentsV1ProjectGetAllNode
  | CurrentsV1ProjectGetInsightsNode
  ;