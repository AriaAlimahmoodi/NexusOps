/**
 * Slack - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV23UserGroupCreateNode } from './operation_create';
import type { SlackV23UserGroupDisableNode } from './operation_disable';
import type { SlackV23UserGroupEnableNode } from './operation_enable';
import type { SlackV23UserGroupGetAllNode } from './operation_get_all';
import type { SlackV23UserGroupGetUsersNode } from './operation_get_users';
import type { SlackV23UserGroupUpdateNode } from './operation_update';
import type { SlackV23UserGroupUpdateUsersNode } from './operation_update_users';

export * from './operation_create';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get_all';
export * from './operation_get_users';
export * from './operation_update';
export * from './operation_update_users';

export type SlackV23UserGroupNode =
  | SlackV23UserGroupCreateNode
  | SlackV23UserGroupDisableNode
  | SlackV23UserGroupEnableNode
  | SlackV23UserGroupGetAllNode
  | SlackV23UserGroupGetUsersNode
  | SlackV23UserGroupUpdateNode
  | SlackV23UserGroupUpdateUsersNode
  ;