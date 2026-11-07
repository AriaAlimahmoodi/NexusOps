/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV1ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV1ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcOpenAiV1ImageNode =
  | LcOpenAiV1ImageAnalyzeNode
  | LcOpenAiV1ImageGenerateNode
  ;