/**
 * Salesforce - Account Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1AccountAddNoteNode } from './operation_add_note';
import type { SalesforceV1AccountCreateNode } from './operation_create';
import type { SalesforceV1AccountDeleteNode } from './operation_delete';
import type { SalesforceV1AccountGetNode } from './operation_get';
import type { SalesforceV1AccountGetAllNode } from './operation_get_all';
import type { SalesforceV1AccountGetSummaryNode } from './operation_get_summary';
import type { SalesforceV1AccountUpdateNode } from './operation_update';
import type { SalesforceV1AccountUpsertNode } from './operation_upsert';

export * from './operation_add_note';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_summary';
export * from './operation_update';
export * from './operation_upsert';

export type SalesforceV1AccountNode =
  | SalesforceV1AccountAddNoteNode
  | SalesforceV1AccountCreateNode
  | SalesforceV1AccountDeleteNode
  | SalesforceV1AccountGetNode
  | SalesforceV1AccountGetAllNode
  | SalesforceV1AccountGetSummaryNode
  | SalesforceV1AccountUpdateNode
  | SalesforceV1AccountUpsertNode
  ;