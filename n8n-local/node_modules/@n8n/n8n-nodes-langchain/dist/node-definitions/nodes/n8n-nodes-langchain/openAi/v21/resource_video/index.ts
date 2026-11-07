/**
 * OpenAI - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV21VideoGenerateNode } from './operation_generate';

export * from './operation_generate';

export type LcOpenAiV21VideoNode = LcOpenAiV21VideoGenerateNode;