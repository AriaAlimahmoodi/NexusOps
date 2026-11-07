/**
 * Trello - Label Resource
 * Re-exports all operation types for this resource.
 */

import type { TrelloV1LabelAddLabelNode } from './operation_add_label';
import type { TrelloV1LabelCreateNode } from './operation_create';
import type { TrelloV1LabelDeleteNode } from './operation_delete';
import type { TrelloV1LabelGetNode } from './operation_get';
import type { TrelloV1LabelGetAllNode } from './operation_get_all';
import type { TrelloV1LabelRemoveLabelNode } from './operation_remove_label';
import type { TrelloV1LabelUpdateNode } from './operation_update';

export * from './operation_add_label';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove_label';
export * from './operation_update';

export type TrelloV1LabelNode =
  | TrelloV1LabelAddLabelNode
  | TrelloV1LabelCreateNode
  | TrelloV1LabelDeleteNode
  | TrelloV1LabelGetNode
  | TrelloV1LabelGetAllNode
  | TrelloV1LabelRemoveLabelNode
  | TrelloV1LabelUpdateNode
  ;