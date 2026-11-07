/**
 * Wekan - List Resource
 * Re-exports all operation types for this resource.
 */

import type { WekanV1ListCreateNode } from './operation_create';
import type { WekanV1ListDeleteNode } from './operation_delete';
import type { WekanV1ListGetNode } from './operation_get';
import type { WekanV1ListGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type WekanV1ListNode =
  | WekanV1ListCreateNode
  | WekanV1ListDeleteNode
  | WekanV1ListGetNode
  | WekanV1ListGetAllNode
  ;