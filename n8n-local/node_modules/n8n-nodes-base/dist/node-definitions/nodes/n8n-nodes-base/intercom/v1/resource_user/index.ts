/**
 * Intercom - User Resource
 * Re-exports all operation types for this resource.
 */

import type { IntercomV1UserCreateNode } from './operation_create';
import type { IntercomV1UserDeleteNode } from './operation_delete';
import type { IntercomV1UserGetNode } from './operation_get';
import type { IntercomV1UserGetAllNode } from './operation_get_all';
import type { IntercomV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type IntercomV1UserNode =
  | IntercomV1UserCreateNode
  | IntercomV1UserDeleteNode
  | IntercomV1UserGetNode
  | IntercomV1UserGetAllNode
  | IntercomV1UserUpdateNode
  ;