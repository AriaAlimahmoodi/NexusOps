/**
 * Gmail - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV22MessageAddLabelsNode } from './operation_add_labels';
import type { GmailV22MessageDeleteNode } from './operation_delete';
import type { GmailV22MessageGetNode } from './operation_get';
import type { GmailV22MessageGetAllNode } from './operation_get_all';
import type { GmailV22MessageMarkAsReadNode } from './operation_mark_as_read';
import type { GmailV22MessageMarkAsUnreadNode } from './operation_mark_as_unread';
import type { GmailV22MessageRemoveLabelsNode } from './operation_remove_labels';
import type { GmailV22MessageReplyNode } from './operation_reply';
import type { GmailV22MessageSendNode } from './operation_send';
import type { GmailV22MessageSendAndWaitNode } from './operation_send_and_wait';

export * from './operation_add_labels';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_mark_as_read';
export * from './operation_mark_as_unread';
export * from './operation_remove_labels';
export * from './operation_reply';
export * from './operation_send';
export * from './operation_send_and_wait';

export type GmailV22MessageNode =
  | GmailV22MessageAddLabelsNode
  | GmailV22MessageDeleteNode
  | GmailV22MessageGetNode
  | GmailV22MessageGetAllNode
  | GmailV22MessageMarkAsReadNode
  | GmailV22MessageMarkAsUnreadNode
  | GmailV22MessageRemoveLabelsNode
  | GmailV22MessageReplyNode
  | GmailV22MessageSendNode
  | GmailV22MessageSendAndWaitNode
  ;