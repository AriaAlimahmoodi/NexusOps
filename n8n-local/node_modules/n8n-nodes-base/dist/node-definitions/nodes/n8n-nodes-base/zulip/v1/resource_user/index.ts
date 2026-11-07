/**
 * Zulip - User Resource
 * Re-exports all operation types for this resource.
 */

import type { ZulipV1UserCreateNode } from './operation_create';
import type { ZulipV1UserDeactivateNode } from './operation_deactivate';
import type { ZulipV1UserGetNode } from './operation_get';
import type { ZulipV1UserGetAllNode } from './operation_get_all';
import type { ZulipV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_deactivate';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ZulipV1UserNode =
  | ZulipV1UserCreateNode
  | ZulipV1UserDeactivateNode
  | ZulipV1UserGetNode
  | ZulipV1UserGetAllNode
  | ZulipV1UserUpdateNode
  ;