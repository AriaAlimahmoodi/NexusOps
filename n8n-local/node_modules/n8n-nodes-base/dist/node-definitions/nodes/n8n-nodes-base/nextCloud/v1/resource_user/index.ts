/**
 * Nextcloud - User Resource
 * Re-exports all operation types for this resource.
 */

import type { NextCloudV1UserCreateNode } from './operation_create';
import type { NextCloudV1UserDeleteNode } from './operation_delete';
import type { NextCloudV1UserGetNode } from './operation_get';
import type { NextCloudV1UserGetAllNode } from './operation_get_all';
import type { NextCloudV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type NextCloudV1UserNode =
  | NextCloudV1UserCreateNode
  | NextCloudV1UserDeleteNode
  | NextCloudV1UserGetNode
  | NextCloudV1UserGetAllNode
  | NextCloudV1UserUpdateNode
  ;