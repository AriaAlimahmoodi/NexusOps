/**
 * OpenAI Node - Version 1.2
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV12AssistantNode } from './resource_assistant';
import type { LcOpenAiV12TextNode } from './resource_text';
import type { LcOpenAiV12ImageNode } from './resource_image';
import type { LcOpenAiV12AudioNode } from './resource_audio';
import type { LcOpenAiV12FileNode } from './resource_file';

export * from './resource_assistant';
export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';

export type LcOpenAiV12Node =
  | LcOpenAiV12AssistantNode
  | LcOpenAiV12TextNode
  | LcOpenAiV12ImageNode
  | LcOpenAiV12AudioNode
  | LcOpenAiV12FileNode
  ;