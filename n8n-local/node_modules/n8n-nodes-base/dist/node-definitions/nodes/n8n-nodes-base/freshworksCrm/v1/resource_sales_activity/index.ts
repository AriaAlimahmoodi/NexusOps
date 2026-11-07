/**
 * Freshworks CRM - SalesActivity Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1SalesActivityGetNode } from './operation_get';
import type { FreshworksCrmV1SalesActivityGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type FreshworksCrmV1SalesActivityNode =
  | FreshworksCrmV1SalesActivityGetNode
  | FreshworksCrmV1SalesActivityGetAllNode
  ;