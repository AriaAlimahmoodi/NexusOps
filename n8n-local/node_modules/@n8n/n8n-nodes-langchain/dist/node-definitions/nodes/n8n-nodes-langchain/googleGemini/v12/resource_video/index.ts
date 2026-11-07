/**
 * Google Gemini - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV12VideoAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV12VideoDownloadNode } from './operation_download';
import type { LcGoogleGeminiV12VideoGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_download';
export * from './operation_generate';

export type LcGoogleGeminiV12VideoNode =
  | LcGoogleGeminiV12VideoAnalyzeNode
  | LcGoogleGeminiV12VideoDownloadNode
  | LcGoogleGeminiV12VideoGenerateNode
  ;