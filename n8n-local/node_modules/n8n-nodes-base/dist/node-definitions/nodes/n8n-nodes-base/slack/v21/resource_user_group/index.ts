/**
 * Slack - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV21UserGroupCreateNode } from './operation_create';
import type { SlackV21UserGroupDisableNode } from './operation_disable';
import type { SlackV21UserGroupEnableNode } from './operation_enable';
import type { SlackV21UserGroupGetAllNode } from './operation_get_all';
import type { SlackV21UserGroupGetUsersNode } from './operation_get_users';
import type { SlackV21UserGroupUpdateNode } from './operation_update';
import type { SlackV21UserGroupUpdateUsersNode } from './operation_update_users';

export * from './operation_create';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get_all';
export * from './operation_get_users';
export * from './operation_update';
export * from './operation_update_users';

export type SlackV21UserGroupNode =
  | SlackV21UserGroupCreateNode
  | SlackV21UserGroupDisableNode
  | SlackV21UserGroupEnableNode
  | SlackV21UserGroupGetAllNode
  | SlackV21UserGroupGetUsersNode
  | SlackV21UserGroupUpdateNode
  | SlackV21UserGroupUpdateUsersNode
  ;