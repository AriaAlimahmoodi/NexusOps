/**
 * Onfleet - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1TaskCloneNode } from './operation_clone';
import type { OnfleetV1TaskCompleteNode } from './operation_complete';
import type { OnfleetV1TaskCreateNode } from './operation_create';
import type { OnfleetV1TaskDeleteNode } from './operation_delete';
import type { OnfleetV1TaskGetNode } from './operation_get';
import type { OnfleetV1TaskGetAllNode } from './operation_get_all';
import type { OnfleetV1TaskUpdateNode } from './operation_update';

export * from './operation_clone';
export * from './operation_complete';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type OnfleetV1TaskNode =
  | OnfleetV1TaskCloneNode
  | OnfleetV1TaskCompleteNode
  | OnfleetV1TaskCreateNode
  | OnfleetV1TaskDeleteNode
  | OnfleetV1TaskGetNode
  | OnfleetV1TaskGetAllNode
  | OnfleetV1TaskUpdateNode
  ;