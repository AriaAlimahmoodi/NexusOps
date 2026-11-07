/**
 * Todoist - Section Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV22SectionCreateNode } from './operation_create';
import type { TodoistV22SectionDeleteNode } from './operation_delete';
import type { TodoistV22SectionGetNode } from './operation_get';
import type { TodoistV22SectionGetAllNode } from './operation_get_all';
import type { TodoistV22SectionUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV22SectionNode =
  | TodoistV22SectionCreateNode
  | TodoistV22SectionDeleteNode
  | TodoistV22SectionGetNode
  | TodoistV22SectionGetAllNode
  | TodoistV22SectionUpdateNode
  ;