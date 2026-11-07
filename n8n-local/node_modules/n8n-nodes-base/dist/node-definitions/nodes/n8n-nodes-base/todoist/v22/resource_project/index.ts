/**
 * Todoist - Project Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV22ProjectArchiveNode } from './operation_archive';
import type { TodoistV22ProjectCreateNode } from './operation_create';
import type { TodoistV22ProjectDeleteNode } from './operation_delete';
import type { TodoistV22ProjectGetNode } from './operation_get';
import type { TodoistV22ProjectGetAllNode } from './operation_get_all';
import type { TodoistV22ProjectGetCollaboratorsNode } from './operation_get_collaborators';
import type { TodoistV22ProjectUnarchiveNode } from './operation_unarchive';
import type { TodoistV22ProjectUpdateNode } from './operation_update';

export * from './operation_archive';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_collaborators';
export * from './operation_unarchive';
export * from './operation_update';

export type TodoistV22ProjectNode =
  | TodoistV22ProjectArchiveNode
  | TodoistV22ProjectCreateNode
  | TodoistV22ProjectDeleteNode
  | TodoistV22ProjectGetNode
  | TodoistV22ProjectGetAllNode
  | TodoistV22ProjectGetCollaboratorsNode
  | TodoistV22ProjectUnarchiveNode
  | TodoistV22ProjectUpdateNode
  ;