/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV13AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV13AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV13AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV13AudioNode =
  | LcOpenAiV13AudioGenerateNode
  | LcOpenAiV13AudioTranscribeNode
  | LcOpenAiV13AudioTranslateNode
  ;