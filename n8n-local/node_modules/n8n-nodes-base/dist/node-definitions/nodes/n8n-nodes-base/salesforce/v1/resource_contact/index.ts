/**
 * Salesforce - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1ContactAddNoteNode } from './operation_add_note';
import type { SalesforceV1ContactAddToCampaignNode } from './operation_add_to_campaign';
import type { SalesforceV1ContactCreateNode } from './operation_create';
import type { SalesforceV1ContactDeleteNode } from './operation_delete';
import type { SalesforceV1ContactGetNode } from './operation_get';
import type { SalesforceV1ContactGetAllNode } from './operation_get_all';
import type { SalesforceV1ContactGetSummaryNode } from './operation_get_summary';
import type { SalesforceV1ContactUpdateNode } from './operation_update';
import type { SalesforceV1ContactUpsertNode } from './operation_upsert';

export * from './operation_add_note';
export * from './operation_add_to_campaign';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_summary';
export * from './operation_update';
export * from './operation_upsert';

export type SalesforceV1ContactNode =
  | SalesforceV1ContactAddNoteNode
  | SalesforceV1ContactAddToCampaignNode
  | SalesforceV1ContactCreateNode
  | SalesforceV1ContactDeleteNode
  | SalesforceV1ContactGetNode
  | SalesforceV1ContactGetAllNode
  | SalesforceV1ContactGetSummaryNode
  | SalesforceV1ContactUpdateNode
  | SalesforceV1ContactUpsertNode
  ;