/**
 * Slack - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV24ChannelArchiveNode } from './operation_archive';
import type { SlackV24ChannelCloseNode } from './operation_close';
import type { SlackV24ChannelCreateNode } from './operation_create';
import type { SlackV24ChannelGetNode } from './operation_get';
import type { SlackV24ChannelGetAllNode } from './operation_get_all';
import type { SlackV24ChannelHistoryNode } from './operation_history';
import type { SlackV24ChannelInviteNode } from './operation_invite';
import type { SlackV24ChannelJoinNode } from './operation_join';
import type { SlackV24ChannelKickNode } from './operation_kick';
import type { SlackV24ChannelLeaveNode } from './operation_leave';
import type { SlackV24ChannelMemberNode } from './operation_member';
import type { SlackV24ChannelOpenNode } from './operation_open';
import type { SlackV24ChannelRenameNode } from './operation_rename';
import type { SlackV24ChannelRepliesNode } from './operation_replies';
import type { SlackV24ChannelSetPurposeNode } from './operation_set_purpose';
import type { SlackV24ChannelSetTopicNode } from './operation_set_topic';
import type { SlackV24ChannelUnarchiveNode } from './operation_unarchive';

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

export type SlackV24ChannelNode =
  | SlackV24ChannelArchiveNode
  | SlackV24ChannelCloseNode
  | SlackV24ChannelCreateNode
  | SlackV24ChannelGetNode
  | SlackV24ChannelGetAllNode
  | SlackV24ChannelHistoryNode
  | SlackV24ChannelInviteNode
  | SlackV24ChannelJoinNode
  | SlackV24ChannelKickNode
  | SlackV24ChannelLeaveNode
  | SlackV24ChannelMemberNode
  | SlackV24ChannelOpenNode
  | SlackV24ChannelRenameNode
  | SlackV24ChannelRepliesNode
  | SlackV24ChannelSetPurposeNode
  | SlackV24ChannelSetTopicNode
  | SlackV24ChannelUnarchiveNode
  ;