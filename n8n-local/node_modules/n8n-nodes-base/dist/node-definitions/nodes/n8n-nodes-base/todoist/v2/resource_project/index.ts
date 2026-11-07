/**
 * Todoist - Project Resource
 * Re-exports all operation types for this resource.
 */

import type { TodoistV2ProjectArchiveNode } from './operation_archive';
import type { TodoistV2ProjectCreateNode } from './operation_create';
import type { TodoistV2ProjectDeleteNode } from './operation_delete';
import type { TodoistV2ProjectGetNode } from './operation_get';
import type { TodoistV2ProjectGetAllNode } from './operation_get_all';
import type { TodoistV2ProjectGetCollaboratorsNode } from './operation_get_collaborators';
import type { TodoistV2ProjectUnarchiveNode } from './operation_unarchive';
import type { TodoistV2ProjectUpdateNode } from './operation_update';

export * from './operation_archive';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_collaborators';
export * from './operation_unarchive';
export * from './operation_update';

export type TodoistV2ProjectNode =
  | TodoistV2ProjectArchiveNode
  | TodoistV2ProjectCreateNode
  | TodoistV2ProjectDeleteNode
  | TodoistV2ProjectGetNode
  | TodoistV2ProjectGetAllNode
  | TodoistV2ProjectGetCollaboratorsNode
  | TodoistV2ProjectUnarchiveNode
  | TodoistV2ProjectUpdateNode
  ;