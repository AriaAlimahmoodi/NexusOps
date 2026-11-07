/**
 * Simple Vector Store Node - Version 1.2
 * Re-exports all discriminator combinations.
 */

import type { LcVectorStoreInMemoryV12InsertNode } from './mode_insert';
import type { LcVectorStoreInMemoryV12LoadNode } from './mode_load';
import type { LcVectorStoreInMemoryV12RetrieveNode } from './mode_retrieve';
import type { LcVectorStoreInMemoryV12RetrieveAsToolNode } from './mode_retrieve_as_tool';

export * from './mode_insert';
export * from './mode_load';
export * from './mode_retrieve';
export * from './mode_retrieve_as_tool';

export type LcVectorStoreInMemoryV12Node =
  | LcVectorStoreInMemoryV12InsertNode
  | LcVectorStoreInMemoryV12LoadNode
  | LcVectorStoreInMemoryV12RetrieveNode
  | LcVectorStoreInMemoryV12RetrieveAsToolNode
  ;