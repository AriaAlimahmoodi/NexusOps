/**
 * Discourse - Category Resource
 * Re-exports all operation types for this resource.
 */

import type { DiscourseV1CategoryCreateNode } from './operation_create';
import type { DiscourseV1CategoryGetAllNode } from './operation_get_all';
import type { DiscourseV1CategoryUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get_all';
export * from './operation_update';

export type DiscourseV1CategoryNode =
  | DiscourseV1CategoryCreateNode
  | DiscourseV1CategoryGetAllNode
  | DiscourseV1CategoryUpdateNode
  ;