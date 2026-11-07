/**
 * Google Gemini - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV1VideoAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV1VideoDownloadNode } from './operation_download';
import type { LcGoogleGeminiV1VideoGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_download';
export * from './operation_generate';

export type LcGoogleGeminiV1VideoNode =
  | LcGoogleGeminiV1VideoAnalyzeNode
  | LcGoogleGeminiV1VideoDownloadNode
  | LcGoogleGeminiV1VideoGenerateNode
  ;