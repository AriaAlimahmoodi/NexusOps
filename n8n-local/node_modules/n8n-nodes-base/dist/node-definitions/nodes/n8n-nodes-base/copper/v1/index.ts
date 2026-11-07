/**
 * Copper Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { CopperV1CompanyNode } from './resource_company';
import type { CopperV1CustomerSourceNode } from './resource_customer_source';
import type { CopperV1LeadNode } from './resource_lead';
import type { CopperV1OpportunityNode } from './resource_opportunity';
import type { CopperV1PersonNode } from './resource_person';
import type { CopperV1ProjectNode } from './resource_project';
import type { CopperV1TaskNode } from './resource_task';
import type { CopperV1UserNode } from './resource_user';

export * from './resource_company';
export * from './resource_customer_source';
export * from './resource_lead';
export * from './resource_opportunity';
export * from './resource_person';
export * from './resource_project';
export * from './resource_task';
export * from './resource_user';

export type CopperV1Node =
  | CopperV1CompanyNode
  | CopperV1CustomerSourceNode
  | CopperV1LeadNode
  | CopperV1OpportunityNode
  | CopperV1PersonNode
  | CopperV1ProjectNode
  | CopperV1TaskNode
  | CopperV1UserNode
  ;