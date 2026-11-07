/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV21AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV21AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV21AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV21AudioNode =
  | LcOpenAiV21AudioGenerateNode
  | LcOpenAiV21AudioTranscribeNode
  | LcOpenAiV21AudioTranslateNode
  ;