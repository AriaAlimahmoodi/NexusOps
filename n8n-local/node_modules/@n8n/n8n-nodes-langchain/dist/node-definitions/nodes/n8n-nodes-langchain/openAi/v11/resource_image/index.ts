/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV11ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV11ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcOpenAiV11ImageNode =
  | LcOpenAiV11ImageAnalyzeNode
  | LcOpenAiV11ImageGenerateNode
  ;