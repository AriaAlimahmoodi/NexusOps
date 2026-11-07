/**
 * Slack - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV22ChannelArchiveNode } from './operation_archive';
import type { SlackV22ChannelCloseNode } from './operation_close';
import type { SlackV22ChannelCreateNode } from './operation_create';
import type { SlackV22ChannelGetNode } from './operation_get';
import type { SlackV22ChannelGetAllNode } from './operation_get_all';
import type { SlackV22ChannelHistoryNode } from './operation_history';
import type { SlackV22ChannelInviteNode } from './operation_invite';
import type { SlackV22ChannelJoinNode } from './operation_join';
import type { SlackV22ChannelKickNode } from './operation_kick';
import type { SlackV22ChannelLeaveNode } from './operation_leave';
import type { SlackV22ChannelMemberNode } from './operation_member';
import type { SlackV22ChannelOpenNode } from './operation_open';
import type { SlackV22ChannelRenameNode } from './operation_rename';
import type { SlackV22ChannelRepliesNode } from './operation_replies';
import type { SlackV22ChannelSetPurposeNode } from './operation_set_purpose';
import type { SlackV22ChannelSetTopicNode } from './operation_set_topic';
import type { SlackV22ChannelUnarchiveNode } from './operation_unarchive';

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

export type SlackV22ChannelNode =
  | SlackV22ChannelArchiveNode
  | SlackV22ChannelCloseNode
  | SlackV22ChannelCreateNode
  | SlackV22ChannelGetNode
  | SlackV22ChannelGetAllNode
  | SlackV22ChannelHistoryNode
  | SlackV22ChannelInviteNode
  | SlackV22ChannelJoinNode
  | SlackV22ChannelKickNode
  | SlackV22ChannelLeaveNode
  | SlackV22ChannelMemberNode
  | SlackV22ChannelOpenNode
  | SlackV22ChannelRenameNode
  | SlackV22ChannelRepliesNode
  | SlackV22ChannelSetPurposeNode
  | SlackV22ChannelSetTopicNode
  | SlackV22ChannelUnarchiveNode
  ;