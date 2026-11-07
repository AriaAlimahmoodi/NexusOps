/**
 * OpenAI Node - Version 2.1
 * Re-exports all discriminator combinations.
 */

import type { LcOpenAiV21TextNode } from './resource_text';
import type { LcOpenAiV21ImageNode } from './resource_image';
import type { LcOpenAiV21AudioNode } from './resource_audio';
import type { LcOpenAiV21FileNode } from './resource_file';
import type { LcOpenAiV21ConversationNode } from './resource_conversation';
import type { LcOpenAiV21VideoNode } from './resource_video';

export * from './resource_text';
export * from './resource_image';
export * from './resource_audio';
export * from './resource_file';
export * from './resource_conversation';
export * from './resource_video';

export type LcOpenAiV21Node =
  | LcOpenAiV21TextNode
  | LcOpenAiV21ImageNode
  | LcOpenAiV21AudioNode
  | LcOpenAiV21FileNode
  | LcOpenAiV21ConversationNode
  | LcOpenAiV21VideoNode
  ;