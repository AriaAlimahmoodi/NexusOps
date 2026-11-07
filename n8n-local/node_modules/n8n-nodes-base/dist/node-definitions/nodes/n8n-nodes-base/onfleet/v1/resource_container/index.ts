/**
 * Onfleet - Container Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1ContainerAddTaskNode } from './operation_add_task';
import type { OnfleetV1ContainerGetNode } from './operation_get';
import type { OnfleetV1ContainerUpdateTaskNode } from './operation_update_task';

export * from './operation_add_task';
export * from './operation_get';
export * from './operation_update_task';

export type OnfleetV1ContainerNode =
  | OnfleetV1ContainerAddTaskNode
  | OnfleetV1ContainerGetNode
  | OnfleetV1ContainerUpdateTaskNode
  ;