/**
 * Slack - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV1ChannelArchiveNode } from './operation_archive';
import type { SlackV1ChannelCloseNode } from './operation_close';
import type { SlackV1ChannelCreateNode } from './operation_create';
import type { SlackV1ChannelGetNode } from './operation_get';
import type { SlackV1ChannelGetAllNode } from './operation_get_all';
import type { SlackV1ChannelHistoryNode } from './operation_history';
import type { SlackV1ChannelInviteNode } from './operation_invite';
import type { SlackV1ChannelJoinNode } from './operation_join';
import type { SlackV1ChannelKickNode } from './operation_kick';
import type { SlackV1ChannelLeaveNode } from './operation_leave';
import type { SlackV1ChannelMemberNode } from './operation_member';
import type { SlackV1ChannelOpenNode } from './operation_open';
import type { SlackV1ChannelRenameNode } from './operation_rename';
import type { SlackV1ChannelRepliesNode } from './operation_replies';
import type { SlackV1ChannelSetPurposeNode } from './operation_set_purpose';
import type { SlackV1ChannelSetTopicNode } from './operation_set_topic';
import type { SlackV1ChannelUnarchiveNode } from './operation_unarchive';

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

export type SlackV1ChannelNode =
  | SlackV1ChannelArchiveNode
  | SlackV1ChannelCloseNode
  | SlackV1ChannelCreateNode
  | SlackV1ChannelGetNode
  | SlackV1ChannelGetAllNode
  | SlackV1ChannelHistoryNode
  | SlackV1ChannelInviteNode
  | SlackV1ChannelJoinNode
  | SlackV1ChannelKickNode
  | SlackV1ChannelLeaveNode
  | SlackV1ChannelMemberNode
  | SlackV1ChannelOpenNode
  | SlackV1ChannelRenameNode
  | SlackV1ChannelRepliesNode
  | SlackV1ChannelSetPurposeNode
  | SlackV1ChannelSetTopicNode
  | SlackV1ChannelUnarchiveNode
  ;