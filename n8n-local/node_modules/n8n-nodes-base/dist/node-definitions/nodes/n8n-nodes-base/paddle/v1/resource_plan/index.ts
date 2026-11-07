/**
 * Paddle - Plan Resource
 * Re-exports all operation types for this resource.
 */

import type { PaddleV1PlanGetNode } from './operation_get';
import type { PaddleV1PlanGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type PaddleV1PlanNode =
  | PaddleV1PlanGetNode
  | PaddleV1PlanGetAllNode
  ;