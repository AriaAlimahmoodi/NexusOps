/**
 * Trello - Card Resource
 * Re-exports all operation types for this resource.
 */

import type { TrelloV1CardCreateNode } from './operation_create';
import type { TrelloV1CardDeleteNode } from './operation_delete';
import type { TrelloV1CardGetNode } from './operation_get';
import type { TrelloV1CardUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_update';

export type TrelloV1CardNode =
  | TrelloV1CardCreateNode
  | TrelloV1CardDeleteNode
  | TrelloV1CardGetNode
  | TrelloV1CardUpdateNode
  ;