/**
 * Slack - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV2UserGroupCreateNode } from './operation_create';
import type { SlackV2UserGroupDisableNode } from './operation_disable';
import type { SlackV2UserGroupEnableNode } from './operation_enable';
import type { SlackV2UserGroupGetAllNode } from './operation_get_all';
import type { SlackV2UserGroupGetUsersNode } from './operation_get_users';
import type { SlackV2UserGroupUpdateNode } from './operation_update';
import type { SlackV2UserGroupUpdateUsersNode } from './operation_update_users';

export * from './operation_create';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get_all';
export * from './operation_get_users';
export * from './operation_update';
export * from './operation_update_users';

export type SlackV2UserGroupNode =
  | SlackV2UserGroupCreateNode
  | SlackV2UserGroupDisableNode
  | SlackV2UserGroupEnableNode
  | SlackV2UserGroupGetAllNode
  | SlackV2UserGroupGetUsersNode
  | SlackV2UserGroupUpdateNode
  | SlackV2UserGroupUpdateUsersNode
  ;