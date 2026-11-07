/**
 * Wordpress - User Resource
 * Re-exports all operation types for this resource.
 */

import type { WordpressV1UserCreateNode } from './operation_create';
import type { WordpressV1UserGetNode } from './operation_get';
import type { WordpressV1UserGetAllNode } from './operation_get_all';
import type { WordpressV1UserUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type WordpressV1UserNode =
  | WordpressV1UserCreateNode
  | WordpressV1UserGetNode
  | WordpressV1UserGetAllNode
  | WordpressV1UserUpdateNode
  ;