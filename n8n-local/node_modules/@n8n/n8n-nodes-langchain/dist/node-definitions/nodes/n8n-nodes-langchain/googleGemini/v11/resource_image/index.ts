/**
 * Google Gemini - Image Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV11ImageAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV11ImageEditNode } from './operation_edit';
import type { LcGoogleGeminiV11ImageGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_edit';
export * from './operation_generate';

export type LcGoogleGeminiV11ImageNode =
  | LcGoogleGeminiV11ImageAnalyzeNode
  | LcGoogleGeminiV11ImageEditNode
  | LcGoogleGeminiV11ImageGenerateNode
  ;