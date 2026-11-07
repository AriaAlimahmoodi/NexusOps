/**
 * Gmail - Thread Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV22ThreadAddLabelsNode } from './operation_add_labels';
import type { GmailV22ThreadDeleteNode } from './operation_delete';
import type { GmailV22ThreadGetNode } from './operation_get';
import type { GmailV22ThreadGetAllNode } from './operation_get_all';
import type { GmailV22ThreadRemoveLabelsNode } from './operation_remove_labels';
import type { GmailV22ThreadReplyNode } from './operation_reply';
import type { GmailV22ThreadTrashNode } from './operation_trash';
import type { GmailV22ThreadUntrashNode } from './operation_untrash';

export * from './operation_add_labels';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove_labels';
export * from './operation_reply';
export * from './operation_trash';
export * from './operation_untrash';

export type GmailV22ThreadNode =
  | GmailV22ThreadAddLabelsNode
  | GmailV22ThreadDeleteNode
  | GmailV22ThreadGetNode
  | GmailV22ThreadGetAllNode
  | GmailV22ThreadRemoveLabelsNode
  | GmailV22ThreadReplyNode
  | GmailV22ThreadTrashNode
  | GmailV22ThreadUntrashNode
  ;