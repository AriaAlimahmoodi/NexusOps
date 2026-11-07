/**
 * Discourse - User Resource
 * Re-exports all operation types for this resource.
 */

import type { DiscourseV1UserCreateNode } from './operation_create';
import type { DiscourseV1UserGetNode } from './operation_get';
import type { DiscourseV1UserGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';

export type DiscourseV1UserNode =
  | DiscourseV1UserCreateNode
  | DiscourseV1UserGetNode
  | DiscourseV1UserGetAllNode
  ;