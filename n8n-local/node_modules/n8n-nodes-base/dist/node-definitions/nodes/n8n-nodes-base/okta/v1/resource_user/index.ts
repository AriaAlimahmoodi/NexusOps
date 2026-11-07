/**
 * Okta - User Resource
 * Re-exports all operation types for this resource.
 */

import type { OktaV1UserCreateNode } from './operation_create';
import type { OktaV1UserDeleteNode } from './operation_delete';
import type { OktaV1UserGetNode } from './operation_get';
import type { OktaV1UserGetAllNode } from './operation_get_all';
import type { OktaV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type OktaV1UserNode =
  | OktaV1UserCreateNode
  | OktaV1UserDeleteNode
  | OktaV1UserGetNode
  | OktaV1UserGetAllNode
  | OktaV1UserUpdateNode
  ;