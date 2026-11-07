/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV11AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV11AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV11AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV11AudioNode =
  | LcOpenAiV11AudioGenerateNode
  | LcOpenAiV11AudioTranscribeNode
  | LcOpenAiV11AudioTranslateNode
  ;