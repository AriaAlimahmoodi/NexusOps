/**
 * Anthropic Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LcAnthropicV1DocumentNode } from './resource_document';
import type { LcAnthropicV1FileNode } from './resource_file';
import type { LcAnthropicV1ImageNode } from './resource_image';
import type { LcAnthropicV1PromptNode } from './resource_prompt';
import type { LcAnthropicV1TextNode } from './resource_text';

export * from './resource_document';
export * from './resource_file';
export * from './resource_image';
export * from './resource_prompt';
export * from './resource_text';

export type LcAnthropicV1Node =
  | LcAnthropicV1DocumentNode
  | LcAnthropicV1FileNode
  | LcAnthropicV1ImageNode
  | LcAnthropicV1PromptNode
  | LcAnthropicV1TextNode
  ;