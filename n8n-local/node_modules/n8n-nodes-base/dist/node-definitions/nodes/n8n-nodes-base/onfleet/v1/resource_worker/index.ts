/**
 * Onfleet - Worker Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1WorkerCreateNode } from './operation_create';
import type { OnfleetV1WorkerDeleteNode } from './operation_delete';
import type { OnfleetV1WorkerGetNode } from './operation_get';
import type { OnfleetV1WorkerGetAllNode } from './operation_get_all';
import type { OnfleetV1WorkerGetScheduleNode } from './operation_get_schedule';
import type { OnfleetV1WorkerUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_schedule';
export * from './operation_update';

export type OnfleetV1WorkerNode =
  | OnfleetV1WorkerCreateNode
  | OnfleetV1WorkerDeleteNode
  | OnfleetV1WorkerGetNode
  | OnfleetV1WorkerGetAllNode
  | OnfleetV1WorkerGetScheduleNode
  | OnfleetV1WorkerUpdateNode
  ;