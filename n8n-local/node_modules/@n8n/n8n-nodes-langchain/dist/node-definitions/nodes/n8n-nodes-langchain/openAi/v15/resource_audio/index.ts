/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV15AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV15AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV15AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV15AudioNode =
  | LcOpenAiV15AudioGenerateNode
  | LcOpenAiV15AudioTranscribeNode
  | LcOpenAiV15AudioTranslateNode
  ;