/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV18ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV18ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_generate';

export type LcOpenAiV18ImageNode =
  | LcOpenAiV18ImageAnalyzeNode
  | LcOpenAiV18ImageGenerateNode
  ;