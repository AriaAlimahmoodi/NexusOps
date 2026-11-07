/**
 * SyncroMSP - Rmm Resource
 * Re-exports all operation types for this resource.
 */

import type { SyncroMspV1RmmCreateNode } from './operation_create';
import type { SyncroMspV1RmmDeleteNode } from './operation_delete';
import type { SyncroMspV1RmmGetNode } from './operation_get';
import type { SyncroMspV1RmmGetAllNode } from './operation_get_all';
import type { SyncroMspV1RmmMuteNode } from './operation_mute';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_mute';

export type SyncroMspV1RmmNode =
  | SyncroMspV1RmmCreateNode
  | SyncroMspV1RmmDeleteNode
  | SyncroMspV1RmmGetNode
  | SyncroMspV1RmmGetAllNode
  | SyncroMspV1RmmMuteNode
  ;