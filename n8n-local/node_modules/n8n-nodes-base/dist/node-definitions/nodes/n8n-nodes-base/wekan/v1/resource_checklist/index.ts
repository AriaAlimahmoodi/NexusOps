/**
 * Wekan - Checklist Resource
 * Re-exports all operation types for this resource.
 */

import type { WekanV1ChecklistCreateNode } from './operation_create';
import type { WekanV1ChecklistDeleteNode } from './operation_delete';
import type { WekanV1ChecklistGetNode } from './operation_get';
import type { WekanV1ChecklistGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type WekanV1ChecklistNode =
  | WekanV1ChecklistCreateNode
  | WekanV1ChecklistDeleteNode
  | WekanV1ChecklistGetNode
  | WekanV1ChecklistGetAllNode
  ;