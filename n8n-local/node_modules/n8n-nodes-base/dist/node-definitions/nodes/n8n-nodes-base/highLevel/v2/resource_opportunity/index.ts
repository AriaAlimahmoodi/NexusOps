/**
 * HighLevel - Opportunity Resource
 * Re-exports all operation types for this resource.
 */

import type { HighLevelV2OpportunityCreateNode } from './operation_create';
import type { HighLevelV2OpportunityDeleteNode } from './operation_delete';
import type { HighLevelV2OpportunityGetNode } from './operation_get';
import type { HighLevelV2OpportunityGetAllNode } from './operation_get_all';
import type { HighLevelV2OpportunityUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HighLevelV2OpportunityNode =
  | HighLevelV2OpportunityCreateNode
  | HighLevelV2OpportunityDeleteNode
  | HighLevelV2OpportunityGetNode
  | HighLevelV2OpportunityGetAllNode
  | HighLevelV2OpportunityUpdateNode
  ;