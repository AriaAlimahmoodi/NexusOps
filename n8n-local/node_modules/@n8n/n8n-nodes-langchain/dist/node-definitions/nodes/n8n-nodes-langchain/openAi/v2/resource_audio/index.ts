/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV2AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV2AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV2AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV2AudioNode =
  | LcOpenAiV2AudioGenerateNode
  | LcOpenAiV2AudioTranscribeNode
  | LcOpenAiV2AudioTranslateNode
  ;