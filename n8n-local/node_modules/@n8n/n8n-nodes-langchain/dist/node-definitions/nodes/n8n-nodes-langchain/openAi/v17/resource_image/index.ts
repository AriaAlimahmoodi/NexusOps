/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV17ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV17ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcOpenAiV17ImageNode =
  | LcOpenAiV17ImageAnalyzeNode
  | LcOpenAiV17ImageGenerateNode
  ;