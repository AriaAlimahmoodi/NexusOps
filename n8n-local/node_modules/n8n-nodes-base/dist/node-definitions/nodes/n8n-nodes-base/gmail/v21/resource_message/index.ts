/**
 * Gmail - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV21MessageAddLabelsNode } from './operation_add_labels';
import type { GmailV21MessageDeleteNode } from './operation_delete';
import type { GmailV21MessageGetNode } from './operation_get';
import type { GmailV21MessageGetAllNode } from './operation_get_all';
import type { GmailV21MessageMarkAsReadNode } from './operation_mark_as_read';
import type { GmailV21MessageMarkAsUnreadNode } from './operation_mark_as_unread';
import type { GmailV21MessageRemoveLabelsNode } from './operation_remove_labels';
import type { GmailV21MessageReplyNode } from './operation_reply';
import type { GmailV21MessageSendNode } from './operation_send';
import type { GmailV21MessageSendAndWaitNode } from './operation_send_and_wait';

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

export type GmailV21MessageNode =
  | GmailV21MessageAddLabelsNode
  | GmailV21MessageDeleteNode
  | GmailV21MessageGetNode
  | GmailV21MessageGetAllNode
  | GmailV21MessageMarkAsReadNode
  | GmailV21MessageMarkAsUnreadNode
  | GmailV21MessageRemoveLabelsNode
  | GmailV21MessageReplyNode
  | GmailV21MessageSendNode
  | GmailV21MessageSendAndWaitNode
  ;