/**
 * Gmail - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV1LabelCreateNode } from './operation_create';
import type { GmailV1LabelDeleteNode } from './operation_delete';
import type { GmailV1LabelGetNode } from './operation_get';
import type { GmailV1LabelGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV1LabelNode =
  | GmailV1LabelCreateNode
  | GmailV1LabelDeleteNode
  | GmailV1LabelGetNode
  | GmailV1LabelGetAllNode
  ;