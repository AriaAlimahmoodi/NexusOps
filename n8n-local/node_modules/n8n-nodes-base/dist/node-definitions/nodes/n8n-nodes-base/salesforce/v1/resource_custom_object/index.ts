/**
 * Salesforce - CustomObject Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1CustomObjectCreateNode } from './operation_create';
import type { SalesforceV1CustomObjectDeleteNode } from './operation_delete';
import type { SalesforceV1CustomObjectGetNode } from './operation_get';
import type { SalesforceV1CustomObjectGetAllNode } from './operation_get_all';
import type { SalesforceV1CustomObjectUpdateNode } from './operation_update';
import type { SalesforceV1CustomObjectUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type SalesforceV1CustomObjectNode =
  | SalesforceV1CustomObjectCreateNode
  | SalesforceV1CustomObjectDeleteNode
  | SalesforceV1CustomObjectGetNode
  | SalesforceV1CustomObjectGetAllNode
  | SalesforceV1CustomObjectUpdateNode
  | SalesforceV1CustomObjectUpsertNode
  ;