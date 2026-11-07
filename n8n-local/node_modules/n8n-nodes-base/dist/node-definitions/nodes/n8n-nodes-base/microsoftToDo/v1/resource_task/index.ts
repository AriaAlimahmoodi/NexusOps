/**
 * Microsoft To Do - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftToDoV1TaskCreateNode } from './operation_create';
import type { MicrosoftToDoV1TaskDeleteNode } from './operation_delete';
import type { MicrosoftToDoV1TaskGetNode } from './operation_get';
import type { MicrosoftToDoV1TaskGetAllNode } from './operation_get_all';
import type { MicrosoftToDoV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftToDoV1TaskNode =
  | MicrosoftToDoV1TaskCreateNode
  | MicrosoftToDoV1TaskDeleteNode
  | MicrosoftToDoV1TaskGetNode
  | MicrosoftToDoV1TaskGetAllNode
  | MicrosoftToDoV1TaskUpdateNode
  ;