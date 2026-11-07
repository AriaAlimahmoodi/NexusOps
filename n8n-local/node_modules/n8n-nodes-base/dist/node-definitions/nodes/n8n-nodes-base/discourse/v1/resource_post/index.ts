/**
 * Discourse - Post Resource
 * Re-exports all operation types for this resource.
 */

import type { DiscourseV1PostCreateNode } from './operation_create';
import type { DiscourseV1PostGetNode } from './operation_get';
import type { DiscourseV1PostGetAllNode } from './operation_get_all';
import type { DiscourseV1PostUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type DiscourseV1PostNode =
  | DiscourseV1PostCreateNode
  | DiscourseV1PostGetNode
  | DiscourseV1PostGetAllNode
  | DiscourseV1PostUpdateNode
  ;