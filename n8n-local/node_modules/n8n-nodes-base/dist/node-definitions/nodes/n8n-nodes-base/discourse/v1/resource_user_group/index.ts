/**
 * Discourse - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { DiscourseV1UserGroupAddNode } from './operation_add';
import type { DiscourseV1UserGroupRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type DiscourseV1UserGroupNode =
  | DiscourseV1UserGroupAddNode
  | DiscourseV1UserGroupRemoveNode
  ;