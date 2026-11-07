/**
 * Gmail - Draft Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV1DraftCreateNode } from './operation_create';
import type { GmailV1DraftDeleteNode } from './operation_delete';
import type { GmailV1DraftGetNode } from './operation_get';
import type { GmailV1DraftGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV1DraftNode =
  | GmailV1DraftCreateNode
  | GmailV1DraftDeleteNode
  | GmailV1DraftGetNode
  | GmailV1DraftGetAllNode
  ;