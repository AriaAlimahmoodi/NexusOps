/**
 * Salesforce - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1TaskCreateNode } from './operation_create';
import type { SalesforceV1TaskDeleteNode } from './operation_delete';
import type { SalesforceV1TaskGetNode } from './operation_get';
import type { SalesforceV1TaskGetAllNode } from './operation_get_all';
import type { SalesforceV1TaskGetSummaryNode } from './operation_get_summary';
import type { SalesforceV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_summary';
export * from './operation_update';

export type SalesforceV1TaskNode =
  | SalesforceV1TaskCreateNode
  | SalesforceV1TaskDeleteNode
  | SalesforceV1TaskGetNode
  | SalesforceV1TaskGetAllNode
  | SalesforceV1TaskGetSummaryNode
  | SalesforceV1TaskUpdateNode
  ;