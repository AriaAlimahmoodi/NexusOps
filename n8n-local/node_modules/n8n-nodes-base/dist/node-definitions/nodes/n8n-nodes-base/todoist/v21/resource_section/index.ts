/**
 * Todoist - Section Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV21SectionCreateNode } from './operation_create';
import type { TodoistV21SectionDeleteNode } from './operation_delete';
import type { TodoistV21SectionGetNode } from './operation_get';
import type { TodoistV21SectionGetAllNode } from './operation_get_all';
import type { TodoistV21SectionUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV21SectionNode =
  | TodoistV21SectionCreateNode
  | TodoistV21SectionDeleteNode
  | TodoistV21SectionGetNode
  | TodoistV21SectionGetAllNode
  | TodoistV21SectionUpdateNode
  ;