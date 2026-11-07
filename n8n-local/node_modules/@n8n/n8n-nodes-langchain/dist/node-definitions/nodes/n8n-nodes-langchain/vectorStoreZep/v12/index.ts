/**
 * Zep Vector Store Node - Version 1.2
 * Re-exports all discriminator combinations.
 */

import type { LcVectorStoreZepV12InsertNode } from './mode_insert';
import type { LcVectorStoreZepV12LoadNode } from './mode_load';
import type { LcVectorStoreZepV12RetrieveNode } from './mode_retrieve';
import type { LcVectorStoreZepV12RetrieveAsToolNode } from './mode_retrieve_as_tool';

export * from './mode_insert';
export * from './mode_load';
export * from './mode_retrieve';
export * from './mode_retrieve_as_tool';

export type LcVectorStoreZepV12Node =
  | LcVectorStoreZepV12InsertNode
  | LcVectorStoreZepV12LoadNode
  | LcVectorStoreZepV12RetrieveNode
  | LcVectorStoreZepV12RetrieveAsToolNode
  ;