/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV18AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV18AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV18AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV18AudioNode =
  | LcOpenAiV18AudioGenerateNode
  | LcOpenAiV18AudioTranscribeNode
  | LcOpenAiV18AudioTranslateNode
  ;