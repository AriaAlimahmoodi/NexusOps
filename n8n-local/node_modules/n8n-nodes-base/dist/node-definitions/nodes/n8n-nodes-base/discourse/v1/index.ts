/**
 * Discourse Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { DiscourseV1CategoryNode } from './resource_category';
import type { DiscourseV1GroupNode } from './resource_group';
import type { DiscourseV1PostNode } from './resource_post';
import type { DiscourseV1UserNode } from './resource_user';
import type { DiscourseV1UserGroupNode } from './resource_user_group';

export * from './resource_category';
export * from './resource_group';
export * from './resource_post';
export * from './resource_user';
export * from './resource_user_group';

export type DiscourseV1Node =
  | DiscourseV1CategoryNode
  | DiscourseV1GroupNode
  | DiscourseV1PostNode
  | DiscourseV1UserNode
  | DiscourseV1UserGroupNode
  ;