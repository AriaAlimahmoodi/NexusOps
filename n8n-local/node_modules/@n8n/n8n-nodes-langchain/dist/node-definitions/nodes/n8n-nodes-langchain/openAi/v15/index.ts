/**
 * OpenAI Node - Version 1.5
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV15AssistantNode } from './resource_assistant';
import type { LcOpenAiV15TextNode } from './resource_text';
import type { LcOpenAiV15ImageNode } from './resource_image';
import type { LcOpenAiV15AudioNode } from './resource_audio';
import type { LcOpenAiV15FileNode } from './resource_file';

export * from './resource_assistant';
export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';

export type LcOpenAiV15Node =
  | LcOpenAiV15AssistantNode
  | LcOpenAiV15TextNode
  | LcOpenAiV15ImageNode
  | LcOpenAiV15AudioNode
  | LcOpenAiV15FileNode
  ;