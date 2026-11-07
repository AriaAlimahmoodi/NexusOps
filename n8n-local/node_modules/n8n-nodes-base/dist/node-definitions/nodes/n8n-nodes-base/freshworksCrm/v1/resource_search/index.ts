/**
 * Freshworks CRM - Search Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1SearchLookupNode } from './operation_lookup';
import type { FreshworksCrmV1SearchQueryNode } from './operation_query';

export * from './operation_lookup';
export * from './operation_query';

export type FreshworksCrmV1SearchNode =
  | FreshworksCrmV1SearchLookupNode
  | FreshworksCrmV1SearchQueryNode
  ;