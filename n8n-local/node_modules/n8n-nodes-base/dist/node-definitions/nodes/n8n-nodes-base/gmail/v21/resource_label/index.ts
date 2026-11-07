/**
 * Gmail - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { GmailV21LabelCreateNode } from './operation_create';
import type { GmailV21LabelDeleteNode } from './operation_delete';
import type { GmailV21LabelGetNode } from './operation_get';
import type { GmailV21LabelGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type GmailV21LabelNode =
  | GmailV21LabelCreateNode
  | GmailV21LabelDeleteNode
  | GmailV21LabelGetNode
  | GmailV21LabelGetAllNode
  ;