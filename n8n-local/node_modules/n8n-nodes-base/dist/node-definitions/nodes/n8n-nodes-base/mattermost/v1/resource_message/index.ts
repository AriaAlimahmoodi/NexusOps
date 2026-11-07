/**
 * Mattermost - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { MattermostV1MessageDeleteNode } from './operation_delete';
import type { MattermostV1MessagePostNode } from './operation_post';
import type { MattermostV1MessagePostEphemeralNode } from './operation_post_ephemeral';

export * from './operation_delete';
export * from './operation_post';
export * from './operation_post_ephemeral';

export type MattermostV1MessageNode =
  | MattermostV1MessageDeleteNode
  | MattermostV1MessagePostNode
  | MattermostV1MessagePostEphemeralNode
  ;