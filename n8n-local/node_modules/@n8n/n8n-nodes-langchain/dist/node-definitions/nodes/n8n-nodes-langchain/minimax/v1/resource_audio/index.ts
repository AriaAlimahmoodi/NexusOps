/**
 * MiniMax - Audio Resource
 * Re-exports all operation types for this resource.
 */

import type { LcMinimaxV1AudioTextToSpeechNode } from './operation_text_to_speech';

export * from './operation_text_to_speech';

export type LcMinimaxV1AudioNode = LcMinimaxV1AudioTextToSpeechNode;