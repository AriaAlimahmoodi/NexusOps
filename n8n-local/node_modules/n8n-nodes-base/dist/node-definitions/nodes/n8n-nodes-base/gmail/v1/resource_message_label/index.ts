/**
 * Gmail - MessageLabel Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV1MessageLabelAddNode } from './operation_add';
import type { GmailV1MessageLabelRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type GmailV1MessageLabelNode =
  | GmailV1MessageLabelAddNode
  | GmailV1MessageLabelRemoveNode
  ;