/**
 * Onfleet - Hub Resource
 * Re-exports all operation types for this resource.
 */

import type { OnfleetV1HubCreateNode } from './operation_create';
import type { OnfleetV1HubGetAllNode } from './operation_get_all';
import type { OnfleetV1HubUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get_all';
export * from './operation_update';

export type OnfleetV1HubNode =
  | OnfleetV1HubCreateNode
  | OnfleetV1HubGetAllNode
  | OnfleetV1HubUpdateNode
  ;