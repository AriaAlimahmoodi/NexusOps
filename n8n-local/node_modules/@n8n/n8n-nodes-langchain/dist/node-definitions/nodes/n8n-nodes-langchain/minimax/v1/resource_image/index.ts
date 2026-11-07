/**
 * MiniMax - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcMinimaxV1ImageGenerateNode } from './operation_generate';

export * from './operation_generate';

export type LcMinimaxV1ImageNode = LcMinimaxV1ImageGenerateNode;