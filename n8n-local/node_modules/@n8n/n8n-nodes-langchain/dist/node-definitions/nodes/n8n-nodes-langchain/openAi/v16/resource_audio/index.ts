/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV16AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV16AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV16AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV16AudioNode =
  | LcOpenAiV16AudioGenerateNode
  | LcOpenAiV16AudioTranscribeNode
  | LcOpenAiV16AudioTranslateNode
  ;