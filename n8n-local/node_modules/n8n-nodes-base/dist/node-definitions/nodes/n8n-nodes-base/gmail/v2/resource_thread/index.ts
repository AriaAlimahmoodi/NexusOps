/**
 * Gmail - Thread Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV2ThreadAddLabelsNode } from './operation_add_labels';
import type { GmailV2ThreadDeleteNode } from './operation_delete';
import type { GmailV2ThreadGetNode } from './operation_get';
import type { GmailV2ThreadGetAllNode } from './operation_get_all';
import type { GmailV2ThreadRemoveLabelsNode } from './operation_remove_labels';
import type { GmailV2ThreadReplyNode } from './operation_reply';
import type { GmailV2ThreadTrashNode } from './operation_trash';
import type { GmailV2ThreadUntrashNode } from './operation_untrash';

export * from './operation_add_labels';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove_labels';
export * from './operation_reply';
export * from './operation_trash';
export * from './operation_untrash';

export type GmailV2ThreadNode =
  | GmailV2ThreadAddLabelsNode
  | GmailV2ThreadDeleteNode
  | GmailV2ThreadGetNode
  | GmailV2ThreadGetAllNode
  | GmailV2ThreadRemoveLabelsNode
  | GmailV2ThreadReplyNode
  | GmailV2ThreadTrashNode
  | GmailV2ThreadUntrashNode
  ;