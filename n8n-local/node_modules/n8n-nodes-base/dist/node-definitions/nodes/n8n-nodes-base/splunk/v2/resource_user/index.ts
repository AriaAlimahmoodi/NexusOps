/**
 * Splunk - User Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV2UserCreateNode } from './operation_create';
import type { SplunkV2UserDeleteUserNode } from './operation_delete_user';
import type { SplunkV2UserGetNode } from './operation_get';
import type { SplunkV2UserGetAllNode } from './operation_get_all';
import type { SplunkV2UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_user';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SplunkV2UserNode =
  | SplunkV2UserCreateNode
  | SplunkV2UserDeleteUserNode
  | SplunkV2UserGetNode
  | SplunkV2UserGetAllNode
  | SplunkV2UserUpdateNode
  ;