/**
 * Salesforce Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SalesforceV1AccountNode } from './resource_account';
import type { SalesforceV1AttachmentNode } from './resource_attachment';
import type { SalesforceV1CaseNode } from './resource_case';
import type { SalesforceV1ContactNode } from './resource_contact';
import type { SalesforceV1CustomObjectNode } from './resource_custom_object';
import type { SalesforceV1DocumentNode } from './resource_document';
import type { SalesforceV1FlowNode } from './resource_flow';
import type { SalesforceV1LeadNode } from './resource_lead';
import type { SalesforceV1OpportunityNode } from './resource_opportunity';
import type { SalesforceV1SearchNode } from './resource_search';
import type { SalesforceV1TaskNode } from './resource_task';
import type { SalesforceV1UserNode } from './resource_user';

export * from './resource_account';
export * from './resource_attachment';
export * from './resource_case';
export * from './resource_contact';
export * from './resource_custom_object';
export * from './resource_document';
export * from './resource_flow';
export * from './resource_lead';
export * from './resource_opportunity';
export * from './resource_search';
export * from './resource_task';
export * from './resource_user';

export type SalesforceV1Node =
  | SalesforceV1AccountNode
  | SalesforceV1AttachmentNode
  | SalesforceV1CaseNode
  | SalesforceV1ContactNode
  | SalesforceV1CustomObjectNode
  | SalesforceV1DocumentNode
  | SalesforceV1FlowNode
  | SalesforceV1LeadNode
  | SalesforceV1OpportunityNode
  | SalesforceV1SearchNode
  | SalesforceV1TaskNode
  | SalesforceV1UserNode
  ;