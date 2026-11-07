/**
 * Mattermost Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MattermostV1ChannelNode } from './resource_channel';
import type { MattermostV1MessageNode } from './resource_message';
import type { MattermostV1ReactionNode } from './resource_reaction';
import type { MattermostV1UserNode } from './resource_user';

export * from './resource_channel';
export * from './resource_message';
export * from './resource_reaction';
export * from './resource_user';

export type MattermostV1Node =
  | MattermostV1ChannelNode
  | MattermostV1MessageNode
  | MattermostV1ReactionNode
  | MattermostV1UserNode
  ;