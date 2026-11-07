/**
 * Gmail - Draft Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV2DraftCreateNode } from './operation_create';
import type { GmailV2DraftDeleteNode } from './operation_delete';
import type { GmailV2DraftGetNode } from './operation_get';
import type { GmailV2DraftGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV2DraftNode =
  | GmailV2DraftCreateNode
  | GmailV2DraftDeleteNode
  | GmailV2DraftGetNode
  | GmailV2DraftGetAllNode
  ;