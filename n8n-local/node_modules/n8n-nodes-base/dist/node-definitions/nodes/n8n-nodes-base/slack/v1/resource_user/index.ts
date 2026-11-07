/**
 * Slack - User Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV1UserGetAllNode } from './operation_get_all';
import type { SlackV1UserGetPresenceNode } from './operation_get_presence';
import type { SlackV1UserInfoNode } from './operation_info';

export * from './operation_get_all';
export * from './operation_get_presence';
export * from './operation_info';

export type SlackV1UserNode =
  | SlackV1UserGetAllNode
  | SlackV1UserGetPresenceNode
  | SlackV1UserInfoNode
  ;