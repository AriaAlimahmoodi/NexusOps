/**
 * Freshworks CRM - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1TaskCreateNode } from './operation_create';
import type { FreshworksCrmV1TaskDeleteNode } from './operation_delete';
import type { FreshworksCrmV1TaskGetNode } from './operation_get';
import type { FreshworksCrmV1TaskGetAllNode } from './operation_get_all';
import type { FreshworksCrmV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshworksCrmV1TaskNode =
  | FreshworksCrmV1TaskCreateNode
  | FreshworksCrmV1TaskDeleteNode
  | FreshworksCrmV1TaskGetNode
  | FreshworksCrmV1TaskGetAllNode
  | FreshworksCrmV1TaskUpdateNode
  ;