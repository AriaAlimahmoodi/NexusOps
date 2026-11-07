/**
 * Google Tasks - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleTasksV1TaskCreateNode } from './operation_create';
import type { GoogleTasksV1TaskDeleteNode } from './operation_delete';
import type { GoogleTasksV1TaskGetNode } from './operation_get';
import type { GoogleTasksV1TaskGetAllNode } from './operation_get_all';
import type { GoogleTasksV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleTasksV1TaskNode =
  | GoogleTasksV1TaskCreateNode
  | GoogleTasksV1TaskDeleteNode
  | GoogleTasksV1TaskGetNode
  | GoogleTasksV1TaskGetAllNode
  | GoogleTasksV1TaskUpdateNode
  ;