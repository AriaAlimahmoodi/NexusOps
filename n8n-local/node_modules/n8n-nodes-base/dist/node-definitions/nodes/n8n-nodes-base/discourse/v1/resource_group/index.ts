/**
 * Discourse - Group Resource
 * Re-exports all operation types for this resource.
 */

import type { DiscourseV1GroupCreateNode } from './operation_create';
import type { DiscourseV1GroupGetNode } from './operation_get';
import type { DiscourseV1GroupGetAllNode } from './operation_get_all';
import type { DiscourseV1GroupUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type DiscourseV1GroupNode =
  | DiscourseV1GroupCreateNode
  | DiscourseV1GroupGetNode
  | DiscourseV1GroupGetAllNode
  | DiscourseV1GroupUpdateNode
  ;