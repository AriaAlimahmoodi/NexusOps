/**
 * Gmail - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV2LabelCreateNode } from './operation_create';
import type { GmailV2LabelDeleteNode } from './operation_delete';
import type { GmailV2LabelGetNode } from './operation_get';
import type { GmailV2LabelGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV2LabelNode =
  | GmailV2LabelCreateNode
  | GmailV2LabelDeleteNode
  | GmailV2LabelGetNode
  | GmailV2LabelGetAllNode
  ;