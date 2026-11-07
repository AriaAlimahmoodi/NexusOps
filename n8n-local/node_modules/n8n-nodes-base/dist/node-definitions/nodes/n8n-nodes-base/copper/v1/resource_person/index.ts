/**
 * Copper - Person Resource
 * Re-exports all operation types for this resource.
 */

import type { CopperV1PersonCreateNode } from './operation_create';
import type { CopperV1PersonDeleteNode } from './operation_delete';
import type { CopperV1PersonGetNode } from './operation_get';
import type { CopperV1PersonGetAllNode } from './operation_get_all';
import type { CopperV1PersonUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type CopperV1PersonNode =
  | CopperV1PersonCreateNode
  | CopperV1PersonDeleteNode
  | CopperV1PersonGetNode
  | CopperV1PersonGetAllNode
  | CopperV1PersonUpdateNode
  ;