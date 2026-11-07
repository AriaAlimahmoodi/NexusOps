/**
 * Google Gemini - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV11VideoAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV11VideoDownloadNode } from './operation_download';
import type { LcGoogleGeminiV11VideoGenerateNode } from './operation_generate';

export * from './operation_analyze';
export * from './operation_download';
export * from './operation_generate';

export type LcGoogleGeminiV11VideoNode =
  | LcGoogleGeminiV11VideoAnalyzeNode
  | LcGoogleGeminiV11VideoDownloadNode
  | LcGoogleGeminiV11VideoGenerateNode
  ;