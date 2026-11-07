/**
 * SyncroMSP - Customer Resource
 * Re-exports all operation types for this resource.
 */

import type { SyncroMspV1CustomerCreateNode } from './operation_create';
import type { SyncroMspV1CustomerDeleteNode } from './operation_delete';
import type { SyncroMspV1CustomerGetNode } from './operation_get';
import type { SyncroMspV1CustomerGetAllNode } from './operation_get_all';
import type { SyncroMspV1CustomerUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SyncroMspV1CustomerNode =
  | SyncroMspV1CustomerCreateNode
  | SyncroMspV1CustomerDeleteNode
  | SyncroMspV1CustomerGetNode
  | SyncroMspV1CustomerGetAllNode
  | SyncroMspV1CustomerUpdateNode
  ;