/**
 * OpenAI Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV1AssistantNode } from './resource_assistant';
import type { LcOpenAiV1TextNode } from './resource_text';
import type { LcOpenAiV1ImageNode } from './resource_image';
import type { LcOpenAiV1AudioNode } from './resource_audio';
import type { LcOpenAiV1FileNode } from './resource_file';

export * from './resource_assistant';
export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';

export type LcOpenAiV1Node =
  | LcOpenAiV1AssistantNode
  | LcOpenAiV1TextNode
  | LcOpenAiV1ImageNode
  | LcOpenAiV1AudioNode
  | LcOpenAiV1FileNode
  ;