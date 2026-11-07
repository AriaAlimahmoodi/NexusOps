/**
 * Slack - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV21ChannelArchiveNode } from './operation_archive';
import type { SlackV21ChannelCloseNode } from './operation_close';
import type { SlackV21ChannelCreateNode } from './operation_create';
import type { SlackV21ChannelGetNode } from './operation_get';
import type { SlackV21ChannelGetAllNode } from './operation_get_all';
import type { SlackV21ChannelHistoryNode } from './operation_history';
import type { SlackV21ChannelInviteNode } from './operation_invite';
import type { SlackV21ChannelJoinNode } from './operation_join';
import type { SlackV21ChannelKickNode } from './operation_kick';
import type { SlackV21ChannelLeaveNode } from './operation_leave';
import type { SlackV21ChannelMemberNode } from './operation_member';
import type { SlackV21ChannelOpenNode } from './operation_open';
import type { SlackV21ChannelRenameNode } from './operation_rename';
import type { SlackV21ChannelRepliesNode } from './operation_replies';
import type { SlackV21ChannelSetPurposeNode } from './operation_set_purpose';
import type { SlackV21ChannelSetTopicNode } from './operation_set_topic';
import type { SlackV21ChannelUnarchiveNode } from './operation_unarchive';

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

export type SlackV21ChannelNode =
  | SlackV21ChannelArchiveNode
  | SlackV21ChannelCloseNode
  | SlackV21ChannelCreateNode
  | SlackV21ChannelGetNode
  | SlackV21ChannelGetAllNode
  | SlackV21ChannelHistoryNode
  | SlackV21ChannelInviteNode
  | SlackV21ChannelJoinNode
  | SlackV21ChannelKickNode
  | SlackV21ChannelLeaveNode
  | SlackV21ChannelMemberNode
  | SlackV21ChannelOpenNode
  | SlackV21ChannelRenameNode
  | SlackV21ChannelRepliesNode
  | SlackV21ChannelSetPurposeNode
  | SlackV21ChannelSetTopicNode
  | SlackV21ChannelUnarchiveNode
  ;