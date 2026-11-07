/**
 * HighLevel - Opportunity Resource
 * Re-exports all operation types for this resource.
 */

import type { HighLevelV1OpportunityCreateNode } from './operation_create';
import type { HighLevelV1OpportunityDeleteNode } from './operation_delete';
import type { HighLevelV1OpportunityGetNode } from './operation_get';
import type { HighLevelV1OpportunityGetAllNode } from './operation_get_all';
import type { HighLevelV1OpportunityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HighLevelV1OpportunityNode =
  | HighLevelV1OpportunityCreateNode
  | HighLevelV1OpportunityDeleteNode
  | HighLevelV1OpportunityGetNode
  | HighLevelV1OpportunityGetAllNode
  | HighLevelV1OpportunityUpdateNode
  ;