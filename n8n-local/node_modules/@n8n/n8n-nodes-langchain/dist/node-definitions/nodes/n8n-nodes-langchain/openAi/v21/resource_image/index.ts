/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV21ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV21ImageEditNode } from './operation_edit';
import type { LcOpenAiV21ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_edit';
export * from './operation_generate';

export type LcOpenAiV21ImageNode =
  | LcOpenAiV21ImageAnalyzeNode
  | LcOpenAiV21ImageEditNode
  | LcOpenAiV21ImageGenerateNode
  ;