/**
 * Splunk - User Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV1UserCreateNode } from './operation_create';
import type { SplunkV1UserDeleteNode } from './operation_delete';
import type { SplunkV1UserGetNode } from './operation_get';
import type { SplunkV1UserGetAllNode } from './operation_get_all';
import type { SplunkV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SplunkV1UserNode =
  | SplunkV1UserCreateNode
  | SplunkV1UserDeleteNode
  | SplunkV1UserGetNode
  | SplunkV1UserGetAllNode
  | SplunkV1UserUpdateNode
  ;