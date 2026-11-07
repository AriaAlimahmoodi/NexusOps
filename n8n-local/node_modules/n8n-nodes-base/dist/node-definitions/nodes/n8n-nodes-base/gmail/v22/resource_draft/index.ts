/**
 * Gmail - Draft Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV22DraftCreateNode } from './operation_create';
import type { GmailV22DraftDeleteNode } from './operation_delete';
import type { GmailV22DraftGetNode } from './operation_get';
import type { GmailV22DraftGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV22DraftNode =
  | GmailV22DraftCreateNode
  | GmailV22DraftDeleteNode
  | GmailV22DraftGetNode
  | GmailV22DraftGetAllNode
  ;