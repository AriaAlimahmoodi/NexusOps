/**
 * Gmail - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV2MessageAddLabelsNode } from './operation_add_labels';
import type { GmailV2MessageDeleteNode } from './operation_delete';
import type { GmailV2MessageGetNode } from './operation_get';
import type { GmailV2MessageGetAllNode } from './operation_get_all';
import type { GmailV2MessageMarkAsReadNode } from './operation_mark_as_read';
import type { GmailV2MessageMarkAsUnreadNode } from './operation_mark_as_unread';
import type { GmailV2MessageRemoveLabelsNode } from './operation_remove_labels';
import type { GmailV2MessageReplyNode } from './operation_reply';
import type { GmailV2MessageSendNode } from './operation_send';
import type { GmailV2MessageSendAndWaitNode } from './operation_send_and_wait';

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

export type GmailV2MessageNode =
  | GmailV2MessageAddLabelsNode
  | GmailV2MessageDeleteNode
  | GmailV2MessageGetNode
  | GmailV2MessageGetAllNode
  | GmailV2MessageMarkAsReadNode
  | GmailV2MessageMarkAsUnreadNode
  | GmailV2MessageRemoveLabelsNode
  | GmailV2MessageReplyNode
  | GmailV2MessageSendNode
  | GmailV2MessageSendAndWaitNode
  ;