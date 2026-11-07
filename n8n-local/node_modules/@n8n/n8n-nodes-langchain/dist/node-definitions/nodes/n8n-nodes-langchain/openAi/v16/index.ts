/**
 * OpenAI Node - Version 1.6
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV16AssistantNode } from './resource_assistant';
import type { LcOpenAiV16TextNode } from './resource_text';
import type { LcOpenAiV16ImageNode } from './resource_image';
import type { LcOpenAiV16AudioNode } from './resource_audio';
import type { LcOpenAiV16FileNode } from './resource_file';

export * from './resource_assistant';
export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';

export type LcOpenAiV16Node =
  | LcOpenAiV16AssistantNode
  | LcOpenAiV16TextNode
  | LcOpenAiV16ImageNode
  | LcOpenAiV16AudioNode
  | LcOpenAiV16FileNode
  ;