/**
 * Twist - Thread Resource
 * Re-exports all operation types for this resource.
 */

import type { TwistV1ThreadCreateNode } from './operation_create';
import type { TwistV1ThreadDeleteNode } from './operation_delete';
import type { TwistV1ThreadGetNode } from './operation_get';
import type { TwistV1ThreadGetAllNode } from './operation_get_all';
import type { TwistV1ThreadUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TwistV1ThreadNode =
  | TwistV1ThreadCreateNode
  | TwistV1ThreadDeleteNode
  | TwistV1ThreadGetNode
  | TwistV1ThreadGetAllNode
  | TwistV1ThreadUpdateNode
  ;