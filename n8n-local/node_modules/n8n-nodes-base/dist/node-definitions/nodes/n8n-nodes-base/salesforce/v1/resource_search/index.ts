/**
 * Salesforce - Search Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesforceV1SearchQueryNode } from './operation_query';

export * from './operation_query';

export type SalesforceV1SearchNode = SalesforceV1SearchQueryNode;