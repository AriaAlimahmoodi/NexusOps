/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV14AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV14AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV14AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV14AudioNode =
  | LcOpenAiV14AudioGenerateNode
  | LcOpenAiV14AudioTranscribeNode
  | LcOpenAiV14AudioTranslateNode
  ;