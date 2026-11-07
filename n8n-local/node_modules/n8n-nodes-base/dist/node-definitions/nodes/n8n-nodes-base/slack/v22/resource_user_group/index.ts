/**
 * Slack - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV22UserGroupCreateNode } from './operation_create';
import type { SlackV22UserGroupDisableNode } from './operation_disable';
import type { SlackV22UserGroupEnableNode } from './operation_enable';
import type { SlackV22UserGroupGetAllNode } from './operation_get_all';
import type { SlackV22UserGroupGetUsersNode } from './operation_get_users';
import type { SlackV22UserGroupUpdateNode } from './operation_update';
import type { SlackV22UserGroupUpdateUsersNode } from './operation_update_users';

export * from './operation_create';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get_all';
export * from './operation_get_users';
export * from './operation_update';
export * from './operation_update_users';

export type SlackV22UserGroupNode =
  | SlackV22UserGroupCreateNode
  | SlackV22UserGroupDisableNode
  | SlackV22UserGroupEnableNode
  | SlackV22UserGroupGetAllNode
  | SlackV22UserGroupGetUsersNode
  | SlackV22UserGroupUpdateNode
  | SlackV22UserGroupUpdateUsersNode
  ;