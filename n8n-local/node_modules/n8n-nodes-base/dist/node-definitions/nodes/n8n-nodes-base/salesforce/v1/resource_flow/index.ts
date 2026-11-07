/**
 * Salesforce - Flow Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1FlowGetAllNode } from './operation_get_all';
import type { SalesforceV1FlowInvokeNode } from './operation_invoke';

export * from './operation_get_all';
export * from './operation_invoke';

export type SalesforceV1FlowNode =
  | SalesforceV1FlowGetAllNode
  | SalesforceV1FlowInvokeNode
  ;