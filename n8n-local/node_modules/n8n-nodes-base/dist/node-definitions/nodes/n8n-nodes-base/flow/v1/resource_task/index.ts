/**
 * Flow - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { FlowV1TaskCreateNode } from './operation_create';
import type { FlowV1TaskGetNode } from './operation_get';
import type { FlowV1TaskGetAllNode } from './operation_get_all';
import type { FlowV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FlowV1TaskNode =
  | FlowV1TaskCreateNode
  | FlowV1TaskGetNode
  | FlowV1TaskGetAllNode
  | FlowV1TaskUpdateNode
  ;