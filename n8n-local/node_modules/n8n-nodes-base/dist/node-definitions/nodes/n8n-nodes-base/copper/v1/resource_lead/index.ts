/**
 * Copper - Lead Resource
 * Re-exports all operation types for this resource.
 */

import type { CopperV1LeadCreateNode } from './operation_create';
import type { CopperV1LeadDeleteNode } from './operation_delete';
import type { CopperV1LeadGetNode } from './operation_get';
import type { CopperV1LeadGetAllNode } from './operation_get_all';
import type { CopperV1LeadUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type CopperV1LeadNode =
  | CopperV1LeadCreateNode
  | CopperV1LeadDeleteNode
  | CopperV1LeadGetNode
  | CopperV1LeadGetAllNode
  | CopperV1LeadUpdateNode
  ;