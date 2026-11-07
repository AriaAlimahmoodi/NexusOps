/**
 * Slack - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV2ChannelArchiveNode } from './operation_archive';
import type { SlackV2ChannelCloseNode } from './operation_close';
import type { SlackV2ChannelCreateNode } from './operation_create';
import type { SlackV2ChannelGetNode } from './operation_get';
import type { SlackV2ChannelGetAllNode } from './operation_get_all';
import type { SlackV2ChannelHistoryNode } from './operation_history';
import type { SlackV2ChannelInviteNode } from './operation_invite';
import type { SlackV2ChannelJoinNode } from './operation_join';
import type { SlackV2ChannelKickNode } from './operation_kick';
import type { SlackV2ChannelLeaveNode } from './operation_leave';
import type { SlackV2ChannelMemberNode } from './operation_member';
import type { SlackV2ChannelOpenNode } from './operation_open';
import type { SlackV2ChannelRenameNode } from './operation_rename';
import type { SlackV2ChannelRepliesNode } from './operation_replies';
import type { SlackV2ChannelSetPurposeNode } from './operation_set_purpose';
import type { SlackV2ChannelSetTopicNode } from './operation_set_topic';
import type { SlackV2ChannelUnarchiveNode } from './operation_unarchive';

export * from './operation_archive';
export * from './operation_close';
export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_history';
export * from './operation_invite';
export * from './operation_join';
export * from './operation_kick';
export * from './operation_leave';
export * from './operation_member';
export * from './operation_open';
export * from './operation_rename';
export * from './operation_replies';
export * from './operation_set_purpose';
export * from './operation_set_topic';
export * from './operation_unarchive';

export type SlackV2ChannelNode =
  | SlackV2ChannelArchiveNode
  | SlackV2ChannelCloseNode
  | SlackV2ChannelCreateNode
  | SlackV2ChannelGetNode
  | SlackV2ChannelGetAllNode
  | SlackV2ChannelHistoryNode
  | SlackV2ChannelInviteNode
  | SlackV2ChannelJoinNode
  | SlackV2ChannelKickNode
  | SlackV2ChannelLeaveNode
  | SlackV2ChannelMemberNode
  | SlackV2ChannelOpenNode
  | SlackV2ChannelRenameNode
  | SlackV2ChannelRepliesNode
  | SlackV2ChannelSetPurposeNode
  | SlackV2ChannelSetTopicNode
  | SlackV2ChannelUnarchiveNode
  ;