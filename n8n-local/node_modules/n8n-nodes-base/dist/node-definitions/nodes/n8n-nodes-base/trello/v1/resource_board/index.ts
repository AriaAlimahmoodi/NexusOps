/**
 * Trello - Board Resource
 * Re-exports all operation types for this resource.
 */

import type { TrelloV1BoardCreateNode } from './operation_create';
import type { TrelloV1BoardDeleteNode } from './operation_delete';
import type { TrelloV1BoardGetNode } from './operation_get';
import type { TrelloV1BoardUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_update';

export type TrelloV1BoardNode =
  | TrelloV1BoardCreateNode
  | TrelloV1BoardDeleteNode
  | TrelloV1BoardGetNode
  | TrelloV1BoardUpdateNode
  ;