/**
 * Chroma Vector Store Node Types
 *
 * Re-exports all version-specific types and provides combined union type.
 */

import type { LcVectorStoreChromaDBV13Node } from './v13';
import type { LcVectorStoreChromaDBV12Node } from './v12';
import type { LcVectorStoreChromaDBV11Node } from './v11';
import type { LcVectorStoreChromaDBV1Node } from './v1';

export * from './v13';
export * from './v12';
export * from './v11';
export * from './v1';

// Combined union type for all versions
export type LcVectorStoreChromaDBNode = LcVectorStoreChromaDBV13Node | LcVectorStoreChromaDBV12Node | LcVectorStoreChromaDBV11Node | LcVectorStoreChromaDBV1Node;