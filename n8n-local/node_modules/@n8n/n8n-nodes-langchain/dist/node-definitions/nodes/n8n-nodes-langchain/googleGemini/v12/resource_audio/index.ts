/**
 * Google Gemini - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcGoogleGeminiV12AudioAnalyzeNode } from './operation_analyze';
import type { LcGoogleGeminiV12AudioTranscribeNode } from './operation_transcribe';

export * from './operation_analyze';
export * from './operation_transcribe';

export type LcGoogleGeminiV12AudioNode =
  | LcGoogleGeminiV12AudioAnalyzeNode
  | LcGoogleGeminiV12AudioTranscribeNode
  ;