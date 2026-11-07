/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV17AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV17AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV17AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV17AudioNode =
  | LcOpenAiV17AudioGenerateNode
  | LcOpenAiV17AudioTranscribeNode
  | LcOpenAiV17AudioTranslateNode
  ;