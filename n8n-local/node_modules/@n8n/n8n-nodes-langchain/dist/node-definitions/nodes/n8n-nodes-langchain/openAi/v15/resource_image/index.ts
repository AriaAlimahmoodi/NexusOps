/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV15ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV15ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcOpenAiV15ImageNode =
  | LcOpenAiV15ImageAnalyzeNode
  | LcOpenAiV15ImageGenerateNode
  ;