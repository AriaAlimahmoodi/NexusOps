/**
 * Slack Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SlackV1ChannelNode } from './resource_channel';
import type { SlackV1FileNode } from './resource_file';
import type { SlackV1MessageNode } from './resource_message';
import type { SlackV1ReactionNode } from './resource_reaction';
import type { SlackV1StarNode } from './resource_star';
import type { SlackV1UserNode } from './resource_user';
import type { SlackV1UserGroupNode } from './resource_user_group';
import type { SlackV1UserProfileNode } from './resource_user_profile';

export * from './resource_channel';
export * from './resource_file';
export * from './resource_message';
export * from './resource_reaction';
export * from './resource_star';
export * from './resource_user';
export * from './resource_user_group';
export * from './resource_user_profile';

export type SlackV1Node =
  | SlackV1ChannelNode
  | SlackV1FileNode
  | SlackV1MessageNode
  | SlackV1ReactionNode
  | SlackV1StarNode
  | SlackV1UserNode
  | SlackV1UserGroupNode
  | SlackV1UserProfileNode
  ;