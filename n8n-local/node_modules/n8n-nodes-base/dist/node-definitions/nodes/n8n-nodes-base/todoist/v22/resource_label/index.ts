/**
 * Todoist - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV22LabelCreateNode } from './operation_create';
import type { TodoistV22LabelDeleteNode } from './operation_delete';
import type { TodoistV22LabelGetNode } from './operation_get';
import type { TodoistV22LabelGetAllNode } from './operation_get_all';
import type { TodoistV22LabelUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV22LabelNode =
  | TodoistV22LabelCreateNode
  | TodoistV22LabelDeleteNode
  | TodoistV22LabelGetNode
  | TodoistV22LabelGetAllNode
  | TodoistV22LabelUpdateNode
  ;