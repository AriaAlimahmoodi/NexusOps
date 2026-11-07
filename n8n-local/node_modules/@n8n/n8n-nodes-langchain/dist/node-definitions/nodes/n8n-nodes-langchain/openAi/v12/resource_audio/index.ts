/**
 * OpenAI - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOpenAiV12AudioGenerateNode } from './operation_generate';
import type { LcOpenAiV12AudioTranscribeNode } from './operation_transcribe';
import type { LcOpenAiV12AudioTranslateNode } from './operation_translate';

export * from './operation_generate';
export * from './operation_transcribe';
export * from './operation_translate';

export type LcOpenAiV12AudioNode =
  | LcOpenAiV12AudioGenerateNode
  | LcOpenAiV12AudioTranscribeNode
  | LcOpenAiV12AudioTranslateNode
  ;