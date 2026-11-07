/**
 * Slack Node - Version 2.2
 * Re-exports all discriminator combinations.
 */

import type { SlackV22ChannelNode } from './resource_channel';
import type { SlackV22FileNode } from './resource_file';
import type { SlackV22MessageNode } from './resource_message';
import type { SlackV22ReactionNode } from './resource_reaction';
import type { SlackV22StarNode } from './resource_star';
import type { SlackV22UserNode } from './resource_user';
import type { SlackV22UserGroupNode } from './resource_user_group';

export * from './resource_channel';
export * from './resource_file';
export * from './resource_message';
export * from './resource_reaction';
export * from './resource_star';
export * from './resource_user';
export * from './resource_user_group';

export type SlackV22Node =
  | SlackV22ChannelNode
  | SlackV22FileNode
  | SlackV22MessageNode
  | SlackV22ReactionNode
  | SlackV22StarNode
  | SlackV22UserNode
  | SlackV22UserGroupNode
  ;