/**
 * Freshworks CRM - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1ContactCreateNode } from './operation_create';
import type { FreshworksCrmV1ContactDeleteNode } from './operation_delete';
import type { FreshworksCrmV1ContactGetNode } from './operation_get';
import type { FreshworksCrmV1ContactGetAllNode } from './operation_get_all';
import type { FreshworksCrmV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshworksCrmV1ContactNode =
  | FreshworksCrmV1ContactCreateNode
  | FreshworksCrmV1ContactDeleteNode
  | FreshworksCrmV1ContactGetNode
  | FreshworksCrmV1ContactGetAllNode
  | FreshworksCrmV1ContactUpdateNode
  ;