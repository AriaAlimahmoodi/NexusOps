/**
 * Slack Node - Version 2.4
 * Re-exports all discriminator combinations.
 */

import type { SlackV24ChannelNode } from './resource_channel';
import type { SlackV24FileNode } from './resource_file';
import type { SlackV24MessageNode } from './resource_message';
import type { SlackV24ReactionNode } from './resource_reaction';
import type { SlackV24StarNode } from './resource_star';
import type { SlackV24UserNode } from './resource_user';
import type { SlackV24UserGroupNode } from './resource_user_group';

export * from './resource_channel';
export * from './resource_file';
export * from './resource_message';
export * from './resource_reaction';
export * from './resource_star';
export * from './resource_user';
export * from './resource_user_group';

export type SlackV24Node =
  | SlackV24ChannelNode
  | SlackV24FileNode
  | SlackV24MessageNode
  | SlackV24ReactionNode
  | SlackV24StarNode
  | SlackV24UserNode
  | SlackV24UserGroupNode
  ;