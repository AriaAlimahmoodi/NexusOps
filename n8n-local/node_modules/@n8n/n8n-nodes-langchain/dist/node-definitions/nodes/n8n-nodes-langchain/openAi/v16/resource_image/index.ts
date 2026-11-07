/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV16ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV16ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcOpenAiV16ImageNode =
  | LcOpenAiV16ImageAnalyzeNode
  | LcOpenAiV16ImageGenerateNode
  ;