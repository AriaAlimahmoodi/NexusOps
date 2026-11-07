/**
 * Todoist - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV2LabelCreateNode } from './operation_create';
import type { TodoistV2LabelDeleteNode } from './operation_delete';
import type { TodoistV2LabelGetNode } from './operation_get';
import type { TodoistV2LabelGetAllNode } from './operation_get_all';
import type { TodoistV2LabelUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV2LabelNode =
  | TodoistV2LabelCreateNode
  | TodoistV2LabelDeleteNode
  | TodoistV2LabelGetNode
  | TodoistV2LabelGetAllNode
  | TodoistV2LabelUpdateNode
  ;