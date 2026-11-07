/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV1AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV1AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV1AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV1AudioNode =
  | LcOpenAiV1AudioGenerateNode
  | LcOpenAiV1AudioTranscribeNode
  | LcOpenAiV1AudioTranslateNode
  ;