/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV12ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV12ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcOpenAiV12ImageNode =
  | LcOpenAiV12ImageAnalyzeNode
  | LcOpenAiV12ImageGenerateNode
  ;