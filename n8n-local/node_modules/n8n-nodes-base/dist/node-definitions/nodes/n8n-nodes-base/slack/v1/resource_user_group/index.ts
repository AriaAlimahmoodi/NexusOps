/**
 * Slack - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV1UserGroupCreateNode } from './operation_create';
import type { SlackV1UserGroupDisableNode } from './operation_disable';
import type { SlackV1UserGroupEnableNode } from './operation_enable';
import type { SlackV1UserGroupGetAllNode } from './operation_get_all';
import type { SlackV1UserGroupUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get_all';
export * from './operation_update';

export type SlackV1UserGroupNode =
  | SlackV1UserGroupCreateNode
  | SlackV1UserGroupDisableNode
  | SlackV1UserGroupEnableNode
  | SlackV1UserGroupGetAllNode
  | SlackV1UserGroupUpdateNode
  ;