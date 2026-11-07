/**
 * Wekan - Board Resource
 * Re-exports all operation types for this resource.
 */

import type { WekanV1BoardCreateNode } from './operation_create';
import type { WekanV1BoardDeleteNode } from './operation_delete';
import type { WekanV1BoardGetNode } from './operation_get';
import type { WekanV1BoardGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type WekanV1BoardNode =
  | WekanV1BoardCreateNode
  | WekanV1BoardDeleteNode
  | WekanV1BoardGetNode
  | WekanV1BoardGetAllNode
  ;