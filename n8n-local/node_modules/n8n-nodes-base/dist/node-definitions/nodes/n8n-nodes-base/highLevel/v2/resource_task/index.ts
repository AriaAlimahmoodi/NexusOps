/**
 * HighLevel - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { HighLevelV2TaskCreateNode } from './operation_create';
import type { HighLevelV2TaskDeleteNode } from './operation_delete';
import type { HighLevelV2TaskGetNode } from './operation_get';
import type { HighLevelV2TaskGetAllNode } from './operation_get_all';
import type { HighLevelV2TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HighLevelV2TaskNode =
  | HighLevelV2TaskCreateNode
  | HighLevelV2TaskDeleteNode
  | HighLevelV2TaskGetNode
  | HighLevelV2TaskGetAllNode
  | HighLevelV2TaskUpdateNode
  ;