/**
 * Ollama - Text Resource
 * Re-exports all operation types for this resource.
 */

import type { LcOllamaV1TextMessageNode } from './operation_message';

export * from './operation_message';

export type LcOllamaV1TextNode = LcOllamaV1TextMessageNode;