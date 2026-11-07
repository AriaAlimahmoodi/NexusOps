/**
 * OpenAI - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV2VideoGenerateNode } from './operation_generate';

export * from './operation_generate';

export type LcOpenAiV2VideoNode = LcOpenAiV2VideoGenerateNode;