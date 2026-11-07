/**
 * Copper - Project Resource
 * Re-exports all operation types for this resource.
 */

import type { CopperV1ProjectCreateNode } from './operation_create';
import type { CopperV1ProjectDeleteNode } from './operation_delete';
import type { CopperV1ProjectGetNode } from './operation_get';
import type { CopperV1ProjectGetAllNode } from './operation_get_all';
import type { CopperV1ProjectUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type CopperV1ProjectNode =
  | CopperV1ProjectCreateNode
  | CopperV1ProjectDeleteNode
  | CopperV1ProjectGetNode
  | CopperV1ProjectGetAllNode
  | CopperV1ProjectUpdateNode
  ;