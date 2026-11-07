/**
 * HighLevel Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { HighLevelV1ContactNode } from './resource_contact';
import type { HighLevelV1OpportunityNode } from './resource_opportunity';
import type { HighLevelV1TaskNode } from './resource_task';

export * from './resource_contact';
export * from './resource_opportunity';
export * from './resource_task';

export type HighLevelV1Node =
  | HighLevelV1ContactNode
  | HighLevelV1OpportunityNode
  | HighLevelV1TaskNode
  ;