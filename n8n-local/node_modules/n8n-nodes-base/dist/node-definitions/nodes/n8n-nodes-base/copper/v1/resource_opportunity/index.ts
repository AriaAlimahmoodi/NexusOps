/**
 * Copper - Opportunity Resource
 * Re-exports all operation types for this resource.
 */

import type { CopperV1OpportunityCreateNode } from './operation_create';
import type { CopperV1OpportunityDeleteNode } from './operation_delete';
import type { CopperV1OpportunityGetNode } from './operation_get';
import type { CopperV1OpportunityGetAllNode } from './operation_get_all';
import type { CopperV1OpportunityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type CopperV1OpportunityNode =
  | CopperV1OpportunityCreateNode
  | CopperV1OpportunityDeleteNode
  | CopperV1OpportunityGetNode
  | CopperV1OpportunityGetAllNode
  | CopperV1OpportunityUpdateNode
  ;