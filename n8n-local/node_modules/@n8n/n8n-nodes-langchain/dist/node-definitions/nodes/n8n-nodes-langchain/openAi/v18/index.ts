/**
 * OpenAI Node - Version 1.8
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV18AssistantNode } from './resource_assistant';
import type { LcOpenAiV18TextNode } from './resource_text';
import type { LcOpenAiV18ImageNode } from './resource_image';
import type { LcOpenAiV18AudioNode } from './resource_audio';
import type { LcOpenAiV18FileNode } from './resource_file';

export * from './resource_assistant';
export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';

export type LcOpenAiV18Node =
  | LcOpenAiV18AssistantNode
  | LcOpenAiV18TextNode
  | LcOpenAiV18ImageNode
  | LcOpenAiV18AudioNode
  | LcOpenAiV18FileNode
  ;