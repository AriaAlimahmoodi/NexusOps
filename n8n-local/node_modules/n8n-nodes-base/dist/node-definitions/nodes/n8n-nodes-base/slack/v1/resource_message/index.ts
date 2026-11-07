/**
 * Slack - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV1MessageDeleteNode } from './operation_delete';
import type { SlackV1MessageGetPermalinkNode } from './operation_get_permalink';
import type { SlackV1MessagePostNode } from './operation_post';
import type { SlackV1MessagePostEphemeralNode } from './operation_post_ephemeral';
import type { SlackV1MessageUpdateNode } from './operation_update';

export * from './operation_delete';
export * from './operation_get_permalink';
export * from './operation_post';
export * from './operation_post_ephemeral';
export * from './operation_update';

export type SlackV1MessageNode =
  | SlackV1MessageDeleteNode
  | SlackV1MessageGetPermalinkNode
  | SlackV1MessagePostNode
  | SlackV1MessagePostEphemeralNode
  | SlackV1MessageUpdateNode
  ;