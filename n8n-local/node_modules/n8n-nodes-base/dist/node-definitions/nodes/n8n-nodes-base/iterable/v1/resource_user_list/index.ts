/**
 * Iterable - UserList Resource
 * Re-exports all operation types for this resource.
 */

import type { IterableV1UserListAddNode } from './operation_add';
import type { IterableV1UserListRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type IterableV1UserListNode =
  | IterableV1UserListAddNode
  | IterableV1UserListRemoveNode
  ;