/**
 * Slack - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV24UserGroupCreateNode } from './operation_create';
import type { SlackV24UserGroupDisableNode } from './operation_disable';
import type { SlackV24UserGroupEnableNode } from './operation_enable';
import type { SlackV24UserGroupGetAllNode } from './operation_get_all';
import type { SlackV24UserGroupGetUsersNode } from './operation_get_users';
import type { SlackV24UserGroupUpdateNode } from './operation_update';
import type { SlackV24UserGroupUpdateUsersNode } from './operation_update_users';

export * from './operation_create';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get_all';
export * from './operation_get_users';
export * from './operation_update';
export * from './operation_update_users';

export type SlackV24UserGroupNode =
  | SlackV24UserGroupCreateNode
  | SlackV24UserGroupDisableNode
  | SlackV24UserGroupEnableNode
  | SlackV24UserGroupGetAllNode
  | SlackV24UserGroupGetUsersNode
  | SlackV24UserGroupUpdateNode
  | SlackV24UserGroupUpdateUsersNode
  ;