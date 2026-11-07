/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV23AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV23AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV23AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV23AudioNode =
  | LcOpenAiV23AudioGenerateNode
  | LcOpenAiV23AudioTranscribeNode
  | LcOpenAiV23AudioTranslateNode
  ;