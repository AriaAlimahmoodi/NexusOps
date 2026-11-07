/**
 * Gmail - Message Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV1MessageDeleteNode } from './operation_delete';
import type { GmailV1MessageGetNode } from './operation_get';
import type { GmailV1MessageGetAllNode } from './operation_get_all';
import type { GmailV1MessageReplyNode } from './operation_reply';
import type { GmailV1MessageSendNode } from './operation_send';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_reply';
export * from './operation_send';

export type GmailV1MessageNode =
  | GmailV1MessageDeleteNode
  | GmailV1MessageGetNode
  | GmailV1MessageGetAllNode
  | GmailV1MessageReplyNode
  | GmailV1MessageSendNode
  ;