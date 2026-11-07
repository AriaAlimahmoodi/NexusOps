/**
 * HaloPSA - User Resource
 * Re-exports all operation types for this resource.
 */

import type { HaloPSAV1UserCreateNode } from './operation_create';
import type { HaloPSAV1UserDeleteNode } from './operation_delete';
import type { HaloPSAV1UserGetNode } from './operation_get';
import type { HaloPSAV1UserGetAllNode } from './operation_get_all';
import type { HaloPSAV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type HaloPSAV1UserNode =
  | HaloPSAV1UserCreateNode
  | HaloPSAV1UserDeleteNode
  | HaloPSAV1UserGetNode
  | HaloPSAV1UserGetAllNode
  | HaloPSAV1UserUpdateNode
  ;