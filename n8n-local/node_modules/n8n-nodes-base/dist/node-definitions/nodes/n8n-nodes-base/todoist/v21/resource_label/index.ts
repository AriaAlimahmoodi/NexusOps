/**
 * Todoist - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV21LabelCreateNode } from './operation_create';
import type { TodoistV21LabelDeleteNode } from './operation_delete';
import type { TodoistV21LabelGetNode } from './operation_get';
import type { TodoistV21LabelGetAllNode } from './operation_get_all';
import type { TodoistV21LabelUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV21LabelNode =
  | TodoistV21LabelCreateNode
  | TodoistV21LabelDeleteNode
  | TodoistV21LabelGetNode
  | TodoistV21LabelGetAllNode
  | TodoistV21LabelUpdateNode
  ;