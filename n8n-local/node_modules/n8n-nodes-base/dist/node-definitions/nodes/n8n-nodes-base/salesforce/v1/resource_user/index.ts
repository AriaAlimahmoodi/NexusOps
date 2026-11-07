/**
 * Salesforce - User Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1UserGetNode } from './operation_get';
import type { SalesforceV1UserGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type SalesforceV1UserNode =
  | SalesforceV1UserGetNode
  | SalesforceV1UserGetAllNode
  ;