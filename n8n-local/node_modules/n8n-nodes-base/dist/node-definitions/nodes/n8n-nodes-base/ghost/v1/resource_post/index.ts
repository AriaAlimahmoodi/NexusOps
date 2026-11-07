/**
 * Ghost - Post Resource
 * Re-exports all operation types for this resource.
 */

import type { GhostV1PostGetNode } from './operation_get';
import type { GhostV1PostGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GhostV1PostNode =
  | GhostV1PostGetNode
  | GhostV1PostGetAllNode
  ;