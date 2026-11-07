/**
 * Zammad - User Resource
 * Re-exports all operation types for this resource.
 */

import type { ZammadV1UserCreateNode } from './operation_create';
import type { ZammadV1UserDeleteNode } from './operation_delete';
import type { ZammadV1UserGetNode } from './operation_get';
import type { ZammadV1UserGetAllNode } from './operation_get_all';
import type { ZammadV1UserGetSelfNode } from './operation_get_self';
import type { ZammadV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_self';
export * from './operation_update';

export type ZammadV1UserNode =
  | ZammadV1UserCreateNode
  | ZammadV1UserDeleteNode
  | ZammadV1UserGetNode
  | ZammadV1UserGetAllNode
  | ZammadV1UserGetSelfNode
  | ZammadV1UserUpdateNode
  ;