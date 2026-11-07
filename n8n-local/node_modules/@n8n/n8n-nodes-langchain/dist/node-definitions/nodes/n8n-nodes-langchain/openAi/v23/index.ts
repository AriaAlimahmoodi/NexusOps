/**
 * OpenAI Node - Version 2.3
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV23TextNode } from './resource_text';
import type { LcOpenAiV23ImageNode } from './resource_image';
import type { LcOpenAiV23AudioNode } from './resource_audio';
import type { LcOpenAiV23FileNode } from './resource_file';
import type { LcOpenAiV23ConversationNode } from './resource_conversation';
import type { LcOpenAiV23VideoNode } from './resource_video';

export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';
export * from './resource_conversation';
export * from './resource_video';

export type LcOpenAiV23Node =
  | LcOpenAiV23TextNode
  | LcOpenAiV23ImageNode
  | LcOpenAiV23AudioNode
  | LcOpenAiV23FileNode
  | LcOpenAiV23ConversationNode
  | LcOpenAiV23VideoNode
  ;