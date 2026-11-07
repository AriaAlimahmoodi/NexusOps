/**
 * Todoist - Project Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV21ProjectArchiveNode } from './operation_archive';
import type { TodoistV21ProjectCreateNode } from './operation_create';
import type { TodoistV21ProjectDeleteNode } from './operation_delete';
import type { TodoistV21ProjectGetNode } from './operation_get';
import type { TodoistV21ProjectGetAllNode } from './operation_get_all';
import type { TodoistV21ProjectGetCollaboratorsNode } from './operation_get_collaborators';
import type { TodoistV21ProjectUnarchiveNode } from './operation_unarchive';
import type { TodoistV21ProjectUpdateNode } from './operation_update';

export * from './operation_archive';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_collaborators';
export * from './operation_unarchive';
export * from './operation_update';

export type TodoistV21ProjectNode =
  | TodoistV21ProjectArchiveNode
  | TodoistV21ProjectCreateNode
  | TodoistV21ProjectDeleteNode
  | TodoistV21ProjectGetNode
  | TodoistV21ProjectGetAllNode
  | TodoistV21ProjectGetCollaboratorsNode
  | TodoistV21ProjectUnarchiveNode
  | TodoistV21ProjectUpdateNode
  ;