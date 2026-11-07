/**
 * Google Gemini - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV1ImageAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV1ImageEditNode } from './operation_edit';
import type { LcGoogleGeminiV1ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_edit';
export * from './operation_generate';

export type LcGoogleGeminiV1ImageNode =
  | LcGoogleGeminiV1ImageAnalyzeNode
  | LcGoogleGeminiV1ImageEditNode
  | LcGoogleGeminiV1ImageGenerateNode
  ;