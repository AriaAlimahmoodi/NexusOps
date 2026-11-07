/**
 * Google Gemini - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV12ImageAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV12ImageEditNode } from './operation_edit';
import type { LcGoogleGeminiV12ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_edit';
export * from './operation_generate';

export type LcGoogleGeminiV12ImageNode =
  | LcGoogleGeminiV12ImageAnalyzeNode
  | LcGoogleGeminiV12ImageEditNode
  | LcGoogleGeminiV12ImageGenerateNode
  ;