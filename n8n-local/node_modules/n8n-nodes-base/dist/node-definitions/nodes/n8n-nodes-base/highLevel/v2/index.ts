/**
 * HighLevel Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { HighLevelV2ContactNode } from './resource_contact';
import type { HighLevelV2OpportunityNode } from './resource_opportunity';
import type { HighLevelV2TaskNode } from './resource_task';
import type { HighLevelV2CalendarNode } from './resource_calendar';

export * from './resource_contact';
export * from './resource_opportunity';
export * from './resource_task';
export * from './resource_calendar';

export type HighLevelV2Node =
  | HighLevelV2ContactNode
  | HighLevelV2OpportunityNode
  | HighLevelV2TaskNode
  | HighLevelV2CalendarNode
  ;