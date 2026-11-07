/**
 * Salesforce - Opportunity Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1OpportunityAddNoteNode } from './operation_add_note';
import type { SalesforceV1OpportunityCreateNode } from './operation_create';
import type { SalesforceV1OpportunityDeleteNode } from './operation_delete';
import type { SalesforceV1OpportunityGetNode } from './operation_get';
import type { SalesforceV1OpportunityGetAllNode } from './operation_get_all';
import type { SalesforceV1OpportunityGetSummaryNode } from './operation_get_summary';
import type { SalesforceV1OpportunityUpdateNode } from './operation_update';
import type { SalesforceV1OpportunityUpsertNode } from './operation_upsert';

export * from './operation_add_note';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_summary';
export * from './operation_update';
export * from './operation_upsert';

export type SalesforceV1OpportunityNode =
  | SalesforceV1OpportunityAddNoteNode
  | SalesforceV1OpportunityCreateNode
  | SalesforceV1OpportunityDeleteNode
  | SalesforceV1OpportunityGetNode
  | SalesforceV1OpportunityGetAllNode
  | SalesforceV1OpportunityGetSummaryNode
  | SalesforceV1OpportunityUpdateNode
  | SalesforceV1OpportunityUpsertNode
  ;