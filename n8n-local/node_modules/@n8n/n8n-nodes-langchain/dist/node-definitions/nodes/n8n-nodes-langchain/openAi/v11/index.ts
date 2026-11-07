/**
 * OpenAI Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV11AssistantNode } from './resource_assistant';
import type { LcOpenAiV11TextNode } from './resource_text';
import type { LcOpenAiV11ImageNode } from './resource_image';
import type { LcOpenAiV11AudioNode } from './resource_audio';
import type { LcOpenAiV11FileNode } from './resource_file';

export * from './resource_assistant';
export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';

export type LcOpenAiV11Node =
  | LcOpenAiV11AssistantNode
  | LcOpenAiV11TextNode
  | LcOpenAiV11ImageNode
  | LcOpenAiV11AudioNode
  | LcOpenAiV11FileNode
  ;