/**
 * OpenAI - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV23ImageAnalyzeNode } from './operation_analyze';
import type { LcOpenAiV23ImageEditNode } from './operation_edit';
import type { LcOpenAiV23ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_edit';
export * from './operation_generate';

export type LcOpenAiV23ImageNode =
  | LcOpenAiV23ImageAnalyzeNode
  | LcOpenAiV23ImageEditNode
  | LcOpenAiV23ImageGenerateNode
  ;