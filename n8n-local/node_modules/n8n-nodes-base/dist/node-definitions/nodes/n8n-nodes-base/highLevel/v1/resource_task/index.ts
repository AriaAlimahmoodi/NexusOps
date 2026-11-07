/**
 * HighLevel - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { HighLevelV1TaskCreateNode } from './operation_create';
import type { HighLevelV1TaskDeleteNode } from './operation_delete';
import type { HighLevelV1TaskGetNode } from './operation_get';
import type { HighLevelV1TaskGetAllNode } from './operation_get_all';
import type { HighLevelV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HighLevelV1TaskNode =
  | HighLevelV1TaskCreateNode
  | HighLevelV1TaskDeleteNode
  | HighLevelV1TaskGetNode
  | HighLevelV1TaskGetAllNode
  | HighLevelV1TaskUpdateNode
  ;