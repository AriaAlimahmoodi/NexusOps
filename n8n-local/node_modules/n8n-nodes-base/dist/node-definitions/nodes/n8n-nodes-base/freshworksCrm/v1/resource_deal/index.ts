/**
 * Freshworks CRM - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1DealCreateNode } from './operation_create';
import type { FreshworksCrmV1DealDeleteNode } from './operation_delete';
import type { FreshworksCrmV1DealGetNode } from './operation_get';
import type { FreshworksCrmV1DealGetAllNode } from './operation_get_all';
import type { FreshworksCrmV1DealUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshworksCrmV1DealNode =
  | FreshworksCrmV1DealCreateNode
  | FreshworksCrmV1DealDeleteNode
  | FreshworksCrmV1DealGetNode
  | FreshworksCrmV1DealGetAllNode
  | FreshworksCrmV1DealUpdateNode
  ;