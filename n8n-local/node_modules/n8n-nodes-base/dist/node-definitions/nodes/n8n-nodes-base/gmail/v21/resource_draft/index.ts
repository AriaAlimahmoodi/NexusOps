/**
 * Gmail - Draft Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV21DraftCreateNode } from './operation_create';
import type { GmailV21DraftDeleteNode } from './operation_delete';
import type { GmailV21DraftGetNode } from './operation_get';
import type { GmailV21DraftGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV21DraftNode =
  | GmailV21DraftCreateNode
  | GmailV21DraftDeleteNode
  | GmailV21DraftGetNode
  | GmailV21DraftGetAllNode
  ;