/**
 * Google Gemini - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV1AudioAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV1AudioTranscribeNode } from './operation_transcribe';

export * from './operation_analyze';
export * from './operation_transcribe';

export type LcGoogleGeminiV1AudioNode =
  | LcGoogleGeminiV1AudioAnalyzeNode
  | LcGoogleGeminiV1AudioTranscribeNode
  ;