/**
 * OpenAI Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV2TextNode } from './resource_text';
import type { LcOpenAiV2ImageNode } from './resource_image';
import type { LcOpenAiV2AudioNode } from './resource_audio';
import type { LcOpenAiV2FileNode } from './resource_file';
import type { LcOpenAiV2ConversationNode } from './resource_conversation';
import type { LcOpenAiV2VideoNode } from './resource_video';

export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';
export * from './resource_conversation';
export * from './resource_video';

export type LcOpenAiV2Node =
  | LcOpenAiV2TextNode
  | LcOpenAiV2ImageNode
  | LcOpenAiV2AudioNode
  | LcOpenAiV2FileNode
  | LcOpenAiV2ConversationNode
  | LcOpenAiV2VideoNode
  ;