/**
 * Gmail - Thread Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV21ThreadAddLabelsNode } from './operation_add_labels';
import type { GmailV21ThreadDeleteNode } from './operation_delete';
import type { GmailV21ThreadGetNode } from './operation_get';
import type { GmailV21ThreadGetAllNode } from './operation_get_all';
import type { GmailV21ThreadRemoveLabelsNode } from './operation_remove_labels';
import type { GmailV21ThreadReplyNode } from './operation_reply';
import type { GmailV21ThreadTrashNode } from './operation_trash';
import type { GmailV21ThreadUntrashNode } from './operation_untrash';

export * from './operation_add_labels';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove_labels';
export * from './operation_reply';
export * from './operation_trash';
export * from './operation_untrash';

export type GmailV21ThreadNode =
  | GmailV21ThreadAddLabelsNode
  | GmailV21ThreadDeleteNode
  | GmailV21ThreadGetNode
  | GmailV21ThreadGetAllNode
  | GmailV21ThreadRemoveLabelsNode
  | GmailV21ThreadReplyNode
  | GmailV21ThreadTrashNode
  | GmailV21ThreadUntrashNode
  ;