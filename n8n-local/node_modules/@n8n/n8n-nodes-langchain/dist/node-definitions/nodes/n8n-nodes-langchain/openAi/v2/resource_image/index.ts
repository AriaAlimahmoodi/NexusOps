/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV2ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV2ImageEditNode } from './operation_edit';
import type { LcOpenAiV2ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_edit';
export * from './operation_generate';

export type LcOpenAiV2ImageNode =
  | LcOpenAiV2ImageAnalyzeNode
  | LcOpenAiV2ImageEditNode
  | LcOpenAiV2ImageGenerateNode
  ;