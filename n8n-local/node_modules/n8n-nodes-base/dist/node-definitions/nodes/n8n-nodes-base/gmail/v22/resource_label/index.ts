/**
 * Gmail - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV22LabelCreateNode } from './operation_create';
import type { GmailV22LabelDeleteNode } from './operation_delete';
import type { GmailV22LabelGetNode } from './operation_get';
import type { GmailV22LabelGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV22LabelNode =
  | GmailV22LabelCreateNode
  | GmailV22LabelDeleteNode
  | GmailV22LabelGetNode
  | GmailV22LabelGetAllNode
  ;