/**
 * Todoist - Section Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV2SectionCreateNode } from './operation_create';
import type { TodoistV2SectionDeleteNode } from './operation_delete';
import type { TodoistV2SectionGetNode } from './operation_get';
import type { TodoistV2SectionGetAllNode } from './operation_get_all';
import type { TodoistV2SectionUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TodoistV2SectionNode =
  | TodoistV2SectionCreateNode
  | TodoistV2SectionDeleteNode
  | TodoistV2SectionGetNode
  | TodoistV2SectionGetAllNode
  | TodoistV2SectionUpdateNode
  ;