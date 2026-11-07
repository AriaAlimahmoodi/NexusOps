/**
 * Pipedrive Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PipedriveV1ActivityNode } from './resource_activity';
import type { PipedriveV1DealNode } from './resource_deal';
import type { PipedriveV1DealActivityNode } from './resource_deal_activity';
import type { PipedriveV1DealProductNode } from './resource_deal_product';
import type { PipedriveV1FileNode } from './resource_file';
import type { PipedriveV1LeadNode } from './resource_lead';
import type { PipedriveV1NoteNode } from './resource_note';
import type { PipedriveV1OrganizationNode } from './resource_organization';
import type { PipedriveV1PersonNode } from './resource_person';
import type { PipedriveV1ProductNode } from './resource_product';

export * from './resource_activity';
export * from './resource_deal';
export * from './resource_deal_activity';
export * from './resource_deal_product';
export * from './resource_file';
export * from './resource_lead';
export * from './resource_note';
export * from './resource_organization';
export * from './resource_person';
export * from './resource_product';

export type PipedriveV1Node =
  | PipedriveV1ActivityNode
  | PipedriveV1DealNode
  | PipedriveV1DealActivityNode
  | PipedriveV1DealProductNode
  | PipedriveV1FileNode
  | PipedriveV1LeadNode
  | PipedriveV1NoteNode
  | PipedriveV1OrganizationNode
  | PipedriveV1PersonNode
  | PipedriveV1ProductNode
  ;