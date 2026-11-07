/**
 * Mattermost - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { MattermostV1ChannelAddUserNode } from './operation_add_user';
import type { MattermostV1ChannelCreateNode } from './operation_create';
import type { MattermostV1ChannelDeleteNode } from './operation_delete';
import type { MattermostV1ChannelMembersNode } from './operation_members';
import type { MattermostV1ChannelRestoreNode } from './operation_restore';
import type { MattermostV1ChannelSearchNode } from './operation_search';
import type { MattermostV1ChannelStatisticsNode } from './operation_statistics';

export * from './operation_add_user';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_members';
export * from './operation_restore';
export * from './operation_search';
export * from './operation_statistics';

export type MattermostV1ChannelNode =
  | MattermostV1ChannelAddUserNode
  | MattermostV1ChannelCreateNode
  | MattermostV1ChannelDeleteNode
  | MattermostV1ChannelMembersNode
  | MattermostV1ChannelRestoreNode
  | MattermostV1ChannelSearchNode
  | MattermostV1ChannelStatisticsNode
  ;