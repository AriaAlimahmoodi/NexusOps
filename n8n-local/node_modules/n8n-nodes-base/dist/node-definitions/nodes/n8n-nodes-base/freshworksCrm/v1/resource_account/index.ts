/**
 * Freshworks CRM - Account Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1AccountCreateNode } from './operation_create';
import type { FreshworksCrmV1AccountDeleteNode } from './operation_delete';
import type { FreshworksCrmV1AccountGetNode } from './operation_get';
import type { FreshworksCrmV1AccountGetAllNode } from './operation_get_all';
import type { FreshworksCrmV1AccountUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshworksCrmV1AccountNode =
  | FreshworksCrmV1AccountCreateNode
  | FreshworksCrmV1AccountDeleteNode
  | FreshworksCrmV1AccountGetNode
  | FreshworksCrmV1AccountGetAllNode
  | FreshworksCrmV1AccountUpdateNode
  ;