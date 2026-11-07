/**
 * SyncroMSP - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { SyncroMspV1ContactCreateNode } from './operation_create';
import type { SyncroMspV1ContactDeleteNode } from './operation_delete';
import type { SyncroMspV1ContactGetNode } from './operation_get';
import type { SyncroMspV1ContactGetAllNode } from './operation_get_all';
import type { SyncroMspV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SyncroMspV1ContactNode =
  | SyncroMspV1ContactCreateNode
  | SyncroMspV1ContactDeleteNode
  | SyncroMspV1ContactGetNode
  | SyncroMspV1ContactGetAllNode
  | SyncroMspV1ContactUpdateNode
  ;