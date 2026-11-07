/**
 * Ollama Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LcOllamaV1ImageNode } from './resource_image';
import type { LcOllamaV1TextNode } from './resource_text';

export * from './resource_image';
export * from './resource_text';

export type LcOllamaV1Node =
  | LcOllamaV1ImageNode
  | LcOllamaV1TextNode
  ;