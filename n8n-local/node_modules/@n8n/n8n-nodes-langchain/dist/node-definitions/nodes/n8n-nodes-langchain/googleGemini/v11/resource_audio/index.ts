/**
 * Google Gemini - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV11AudioAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV11AudioTranscribeNode } from './operation_transcribe';

export * from './operation_analyze';
export * from './operation_transcribe';

export type LcGoogleGeminiV11AudioNode =
  | LcGoogleGeminiV11AudioAnalyzeNode
  | LcGoogleGeminiV11AudioTranscribeNode
  ;