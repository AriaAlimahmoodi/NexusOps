/**
 * Salesforce - Lead Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1LeadAddNoteNode } from './operation_add_note';
import type { SalesforceV1LeadAddToCampaignNode } from './operation_add_to_campaign';
import type { SalesforceV1LeadCreateNode } from './operation_create';
import type { SalesforceV1LeadDeleteNode } from './operation_delete';
import type { SalesforceV1LeadGetNode } from './operation_get';
import type { SalesforceV1LeadGetAllNode } from './operation_get_all';
import type { SalesforceV1LeadGetSummaryNode } from './operation_get_summary';
import type { SalesforceV1LeadUpdateNode } from './operation_update';
import type { SalesforceV1LeadUpsertNode } from './operation_upsert';

export * from './operation_add_note';
export * from './operation_add_to_campaign';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_summary';
export * from './operation_update';
export * from './operation_upsert';

export type SalesforceV1LeadNode =
  | SalesforceV1LeadAddNoteNode
  | SalesforceV1LeadAddToCampaignNode
  | SalesforceV1LeadCreateNode
  | SalesforceV1LeadDeleteNode
  | SalesforceV1LeadGetNode
  | SalesforceV1LeadGetAllNode
  | SalesforceV1LeadGetSummaryNode
  | SalesforceV1LeadUpdateNode
  | SalesforceV1LeadUpsertNode
  ;