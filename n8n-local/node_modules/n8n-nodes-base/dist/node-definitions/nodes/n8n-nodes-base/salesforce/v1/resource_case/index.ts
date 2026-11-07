/**
 * Salesforce - Case Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1CaseAddCommentNode } from './operation_add_comment';
import type { SalesforceV1CaseCreateNode } from './operation_create';
import type { SalesforceV1CaseDeleteNode } from './operation_delete';
import type { SalesforceV1CaseGetNode } from './operation_get';
import type { SalesforceV1CaseGetAllNode } from './operation_get_all';
import type { SalesforceV1CaseGetSummaryNode } from './operation_get_summary';
import type { SalesforceV1CaseUpdateNode } from './operation_update';

export * from './operation_add_comment';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_summary';
export * from './operation_update';

export type SalesforceV1CaseNode =
  | SalesforceV1CaseAddCommentNode
  | SalesforceV1CaseCreateNode
  | SalesforceV1CaseDeleteNode
  | SalesforceV1CaseGetNode
  | SalesforceV1CaseGetAllNode
  | SalesforceV1CaseGetSummaryNode
  | SalesforceV1CaseUpdateNode
  ;