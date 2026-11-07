/**
 * Moonshot Kimi - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcMoonshotV1ImageAnalyzeNode } from './operation_analyze';

export * from './operation_analyze';

export type LcMoonshotV1ImageNode = LcMoonshotV1ImageAnalyzeNode;